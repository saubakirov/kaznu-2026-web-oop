"""Unit and integration tests for SQLAlchemy 2.0 course models and SQLite persistence."""

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.db.session import Base
from app.models.course import Student, Submission, TopicProgress


@pytest.fixture
def db_session() -> Session:
    """Provide an in-memory SQLite database session for isolated model testing."""
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = session_factory()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


def test_student_creation(db_session: Session) -> None:
    """Verify Student creation, persistence, and querying."""
    student = Student(username="student_kaznu_01", full_name="Айдос Сериков")
    db_session.add(student)
    db_session.commit()
    db_session.refresh(student)

    assert student.id is not None
    assert student.username == "student_kaznu_01"
    assert student.full_name == "Айдос Сериков"
    assert student.created_at is not None

    stmt = select(Student).where(Student.username == "student_kaznu_01")
    retrieved = db_session.scalar(stmt)
    assert retrieved is not None
    assert retrieved.id == student.id


def test_topic_progress_relationship(db_session: Session) -> None:
    """Verify TopicProgress link to Student profile."""
    student = Student(username="student_kaznu_02", full_name="Динара Мусина")
    db_session.add(student)
    db_session.commit()

    progress = TopicProgress(
        student_id=student.id,
        week_number=1,
        topic_id="w1-t1",
        status="completed",
        score=100,
    )
    db_session.add(progress)
    db_session.commit()

    db_session.refresh(student)
    assert len(student.progress_entries) == 1
    assert student.progress_entries[0].topic_id == "w1-t1"
    assert student.progress_entries[0].score == 100


def test_submission_lifecycle(db_session: Session) -> None:
    """Verify code Submission model persistence and status flags."""
    student = Student(username="student_kaznu_03", full_name="Марат Омаров")
    db_session.add(student)
    db_session.commit()

    code_snippet = "class Passenger: pass"
    submission = Submission(
        student_id=student.id,
        task_id="w1-lab1",
        code=code_snippet,
        status="evaluated",
        passed=True,
        output="1 passed in 0.05s",
    )
    db_session.add(submission)
    db_session.commit()

    db_session.refresh(student)
    assert len(student.submissions) == 1
    assert student.submissions[0].passed is True
    assert student.submissions[0].task_id == "w1-lab1"
    assert student.submissions[0].code == code_snippet
