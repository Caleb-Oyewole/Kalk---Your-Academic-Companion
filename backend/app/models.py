from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, default="")
    password_hash = Column(String, nullable=True)  # null for Google-only accounts
    google_sub = Column(String, unique=True, nullable=True)

    courses = relationship("Course", back_populates="user", cascade="all, delete-orphan")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    code = Column(String, nullable=False)
    title = Column(String, default="")
    units = Column(Integer, nullable=True)
    score = Column(Float, nullable=True)
    grade = Column(String, nullable=True)
    session = Column(String, default="")   # e.g. 2023/2024
    semester = Column(String, default="")  # e.g. First / Second
    excluded = Column(Boolean, default=False)
    needs_review = Column(Boolean, default=False)
    source_file = Column(String, default="")

    user = relationship("User", back_populates="courses")
