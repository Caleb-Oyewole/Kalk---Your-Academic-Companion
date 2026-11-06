from typing import List

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import config, models, schemas
from .database import Base, engine, get_db
from .grading import compute_cgpa, grade_from_score
from .parser import parse_file
from .security import create_access_token, get_current_user, hash_password, verify_password

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CGPA Calculator API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


# ---------- auth ----------

@app.post("/auth/register", response_model=schemas.TokenOut, status_code=201)
def register(body: schemas.RegisterIn, db: Session = Depends(get_db)):
    email = body.email.lower()
    if db.query(models.User).filter_by(email=email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = models.User(email=email, name=body.name, password_hash=hash_password(body.password))
    db.add(user)
    db.commit()
    return schemas.TokenOut(access_token=create_access_token(user.id))


@app.post("/auth/login", response_model=schemas.TokenOut)
def login(body: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=body.email.lower()).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return schemas.TokenOut(access_token=create_access_token(user.id))


@app.post("/auth/google", response_model=schemas.TokenOut)
def google_login(body: schemas.GoogleIn, db: Session = Depends(get_db)):
    if not config.GOOGLE_CLIENT_ID:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Google sign-in is not configured")
    from google.auth.transport import requests as g_requests
    from google.oauth2 import id_token

    try:
        info = id_token.verify_oauth2_token(body.id_token, g_requests.Request(), config.GOOGLE_CLIENT_ID)
    except ValueError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token")
    if not info.get("email_verified"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google email not verified")

    email = info["email"].lower()
    user = db.query(models.User).filter_by(google_sub=info["sub"]).first() or \
        db.query(models.User).filter_by(email=email).first()
    if user is None:
        user = models.User(email=email, name=info.get("name", ""), google_sub=info["sub"])
        db.add(user)
    elif not user.google_sub:
        user.google_sub = info["sub"]
    db.commit()
    return schemas.TokenOut(access_token=create_access_token(user.id))


@app.get("/auth/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    return user


# ---------- courses ----------

def _own_course(db: Session, user: models.User, course_id: int) -> models.Course:
    course = db.get(models.Course, course_id)
    if course is None or course.user_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Course not found")
    return course


def _normalise(course: models.Course):
    course.code = " ".join(course.code.upper().split())
    if course.grade:
        course.grade = course.grade.strip().upper()
    if not course.grade and course.score is not None:
        course.grade = grade_from_score(course.score)
    course.needs_review = course.units is None or course.grade is None


@app.get("/courses", response_model=List[schemas.CourseOut])
def list_courses(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.Course).filter_by(user_id=user.id).order_by(models.Course.id).all()


@app.post("/courses", response_model=schemas.CourseOut, status_code=201)
def add_course(body: schemas.CourseIn, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = models.Course(user_id=user.id, source_file="manual", **body.model_dump())
    _normalise(course)
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@app.patch("/courses/{course_id}", response_model=schemas.CourseOut)
def update_course(course_id: int, body: schemas.CoursePatch,
                  user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    course = _own_course(db, user, course_id)
    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(course, k, v)
    # Editing the score without an explicit grade re-derives the grade.
    if "score" in data and "grade" not in data:
        course.grade = None
    _normalise(course)
    db.commit()
    db.refresh(course)
    return course


@app.delete("/courses/{course_id}", status_code=204)
def delete_course(course_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_own_course(db, user, course_id))
    db.commit()


@app.post("/courses/bulk-exclude", response_model=List[schemas.CourseOut])
def bulk_exclude(body: schemas.BulkExcludeIn, user: models.User = Depends(get_current_user),
                 db: Session = Depends(get_db)):
    courses = db.query(models.Course).filter(
        models.Course.user_id == user.id, models.Course.id.in_(body.ids)
    ).all()
    for c in courses:
        c.excluded = body.excluded
    db.commit()
    return courses


@app.delete("/courses", status_code=204)
def clear_courses(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(models.Course).filter_by(user_id=user.id).delete()
    db.commit()


# ---------- upload + CGPA ----------

@app.post("/results/upload", response_model=List[schemas.CourseOut])
async def upload_results(files: List[UploadFile] = File(...),
                         user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    limit = config.MAX_UPLOAD_MB * 1024 * 1024
    created: List[models.Course] = []
    for f in files:
        data = await f.read()
        if len(data) > limit:
            raise HTTPException(413, f"{f.filename} exceeds {config.MAX_UPLOAD_MB}MB")
        try:
            parsed = parse_file(f.filename or "", data)
        except ValueError as e:
            raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, str(e))
        except Exception:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Could not read {f.filename}")

        for p in parsed:
            # Re-uploading the same result replaces the earlier row rather than duplicating it.
            db.query(models.Course).filter_by(
                user_id=user.id, code=p.code, session=p.session, semester=p.semester
            ).delete()
            course = models.Course(user_id=user.id, **p.__dict__)
            db.add(course)
            created.append(course)
    db.commit()
    for c in created:
        db.refresh(c)
    if not created:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "No courses found in the uploaded file(s)")
    return created


@app.get("/cgpa")
def cgpa(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = db.query(models.Course).filter_by(user_id=user.id).all()
    return compute_cgpa(courses)
