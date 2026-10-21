"""Shared FastAPI dependencies for all API modules."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.course import Student


def get_or_create_student(db: Session, username: str) -> Student:
    """Retrieve existing student or create a default record."""
    stmt = select(Student).where(Student.username == username)
    student = db.scalar(stmt)
    if not student:
        student = Student(username=username, full_name=f"Студент ({username})")
        db.add(student)
        db.commit()
        db.refresh(student)
    return student
