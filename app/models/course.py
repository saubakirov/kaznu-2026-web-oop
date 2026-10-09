"""Declarative ORM models for course users, topics, and submissions."""

from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Student(Base):
    """Student profile model."""

    __tablename__ = "students"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    progress_entries: Mapped[list["TopicProgress"]] = relationship(
        "TopicProgress", back_populates="student", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["Submission"]] = relationship(
        "Submission", back_populates="student", cascade="all, delete-orphan"
    )


class TopicProgress(Base):
    """Topic completion and score progress per student."""

    __tablename__ = "topic_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    week_number: Mapped[int] = mapped_column(Integer, nullable=False)
    topic_id: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="not_started", nullable=False)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    student: Mapped["Student"] = relationship("Student", back_populates="progress_entries")


class Submission(Base):
    """Code submission attempt and evaluation record."""

    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="submitted", nullable=False)
    passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    output: Mapped[str] = mapped_column(Text, default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), nullable=False)

    student: Mapped["Student"] = relationship("Student", back_populates="submissions")
