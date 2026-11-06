from typing import List, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class GoogleIn(BaseModel):
    id_token: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    name: str


class CourseIn(BaseModel):
    code: str
    title: str = ""
    units: Optional[int] = Field(default=None, ge=0, le=12)
    score: Optional[float] = Field(default=None, ge=0, le=100)
    grade: Optional[str] = None
    session: str = ""
    semester: str = ""
    excluded: bool = False


class CoursePatch(BaseModel):
    code: Optional[str] = None
    title: Optional[str] = None
    units: Optional[int] = Field(default=None, ge=0, le=12)
    score: Optional[float] = Field(default=None, ge=0, le=100)
    grade: Optional[str] = None
    session: Optional[str] = None
    semester: Optional[str] = None
    excluded: Optional[bool] = None


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    code: str
    title: str
    units: Optional[int]
    score: Optional[float]
    grade: Optional[str]
    session: str
    semester: str
    excluded: bool
    needs_review: bool
    source_file: str


class BulkExcludeIn(BaseModel):
    ids: List[int]
    excluded: bool = True
