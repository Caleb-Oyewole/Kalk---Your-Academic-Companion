import io
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_cgpa.db"

import pytest
from docx import Document
from fastapi.testclient import TestClient

from app.database import Base, engine
from app.grading import compute_cgpa, grade_from_score
from app.main import app
from app.parser import parse_lines

client = TestClient(app)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield


def auth_headers(email="a@b.com"):
    r = client.post("/auth/register", json={"email": email, "password": "password123", "name": "A"})
    assert r.status_code == 201
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_grade_boundaries():
    assert grade_from_score(70) == "A"
    assert grade_from_score(69.9) == "B"
    assert grade_from_score(45) == "D"
    assert grade_from_score(39) == "F"


def test_parse_lines_with_scores_and_grades():
    lines = [
        "2023/2024 First Semester",
        "CSC 201 Computer Programming I 3 72",
        "MTH101 Elementary Mathematics 4 B",
        "GST 111 Use of English 2 55 C",
        "Second Semester 2023/2024",
        "CSC 202 Data Structures 3 48",
        "random header text",
    ]
    courses = {c.code: c for c in parse_lines(lines)}
    assert courses["CSC 201"].grade == "A" and courses["CSC 201"].units == 3
    assert courses["MTH 101"].grade == "B" and courses["MTH 101"].units == 4
    assert courses["GST 111"].grade == "C"
    assert courses["CSC 202"].semester == "Second"
    assert courses["CSC 202"].session == "2023/2024"
    assert courses["CSC 202"].grade == "D"


def test_cgpa_with_exclusion():
    h = auth_headers()
    for code, units, score in [("CSC 201", 3, 80), ("MTH 101", 4, 65), ("GST 111", 2, 30)]:
        r = client.post("/courses", json={"code": code, "units": units, "score": score}, headers=h)
        assert r.status_code == 201
    # (3*5 + 4*4 + 2*0) / 9
    assert client.get("/cgpa", headers=h).json()["cgpa"] == round(31 / 9, 2)

    courses = client.get("/courses", headers=h).json()
    gst = next(c for c in courses if c["code"] == "GST 111")
    client.post("/courses/bulk-exclude", json={"ids": [gst["id"]]}, headers=h)
    res = client.get("/cgpa", headers=h).json()
    assert res["cgpa"] == round(31 / 7, 2)
    assert res["courses_excluded"] == 1


def test_docx_upload():
    h = auth_headers()
    doc = Document()
    doc.add_paragraph("2022/2023 First Semester")
    table = doc.add_table(rows=3, cols=4)
    rows = [("Code", "Title", "Units", "Score"),
            ("CSC 301", "Operating Systems", "3", "74"),
            ("STA 311", "Engineering Statistics", "2", "58")]
    for r, vals in zip(table.rows, rows):
        for cell, v in zip(r.cells, vals):
            cell.text = v
    buf = io.BytesIO()
    doc.save(buf)

    r = client.post("/results/upload", headers=h,
                    files={"files": ("res.docx", buf.getvalue(),
                                     "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert r.status_code == 200, r.text
    assert {c["code"] for c in r.json()} == {"CSC 301", "STA 311"}
    assert client.get("/cgpa", headers=h).json()["cgpa"] == round((3 * 5 + 2 * 3) / 5, 2)


def test_pdf_upload():
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for line in ["2021/2022 First Semester", "CSC 101 Intro to Computing 3 66", "MTH 102 Calculus 4 41"]:
        c.drawString(72, y, line)
        y -= 20
    c.save()

    h = auth_headers()
    r = client.post("/results/upload", headers=h, files={"files": ("res.pdf", buf.getvalue(), "application/pdf")})
    assert r.status_code == 200, r.text
    assert len(r.json()) == 2


def test_auth_required_and_isolation():
    assert client.get("/courses").status_code == 401
    h1, h2 = auth_headers("one@x.com"), auth_headers("two@x.com")
    cid = client.post("/courses", json={"code": "CSC 101", "units": 3, "score": 70}, headers=h1).json()["id"]
    assert client.patch(f"/courses/{cid}", json={"excluded": True}, headers=h2).status_code == 404


def test_unsupported_type():
    h = auth_headers()
    r = client.post("/results/upload", headers=h, files={"files": ("a.exe", b"x", "application/octet-stream")})
    assert r.status_code == 415


def test_login_flow():
    auth_headers("z@z.com")
    assert client.post("/auth/login", json={"email": "z@z.com", "password": "password123"}).status_code == 200
    assert client.post("/auth/login", json={"email": "z@z.com", "password": "wrongpass"}).status_code == 401


def test_docx_keeps_semester_headings_with_their_tables():
    h = auth_headers()
    doc = Document()
    for heading, rows in [
        ("2023/2024 First Semester", [("CSC 201", "3", "78")]),
        ("2023/2024 Second Semester", [("CSC 202", "3", "68")]),
    ]:
        doc.add_paragraph(heading)
        table = doc.add_table(rows=0, cols=3)
        for r in rows:
            cells = table.add_row().cells
            for cell, v in zip(cells, r):
                cell.text = v
    buf = io.BytesIO()
    doc.save(buf)
    r = client.post("/results/upload", headers=h, files={"files": ("res.docx", buf.getvalue(), "application/octet-stream")})
    assert r.status_code == 200, r.text
    terms = {c["code"]: c["semester"] for c in r.json()}
    assert terms == {"CSC 201": "First", "CSC 202": "Second"}
