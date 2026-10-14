"""REST API endpoints for Week 1 instructional materials, quiz, and practice verification."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.course import Student, Submission, TopicProgress
from app.services.content_service import content_service

router = APIRouter(prefix="/api/week1", tags=["Week 1"])


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


class QuizSubmitRequest(BaseModel):
    """Payload for submitting quiz answers."""

    username: str = Field(default="default_student", description="Student identifier")
    answers: dict[str, int] = Field(description="Dictionary mapping question ID to chosen option index")


class PracticeSubmitRequest(BaseModel):
    """Payload for submitting Python practice solution."""

    username: str = Field(default="default_student", description="Student identifier")
    code: str = Field(description="Python source code solution")


class Week1ProgressResponse(BaseModel):
    """Aggregate progress report for Week 1."""

    username: str
    quiz_score: int
    quiz_max: int = 10
    practice_score: int
    practice_max: int = 10
    total_score: int
    total_max: int = 20
    is_completed: bool


@router.get("/lecture", status_code=status.HTTP_200_OK)
def get_lecture() -> dict[str, Any]:
    """Return Week 1 lecture content, sections, and Mermaid diagrams."""
    try:
        return content_service.get_lecture()
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.get("/quiz", status_code=status.HTTP_200_OK)
def get_quiz() -> dict[str, Any]:
    """Return Week 1 quiz questions without revealing correct answers."""
    try:
        return content_service.get_quiz(mask_answers=True)
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post("/quiz/submit", status_code=status.HTTP_200_OK)
def submit_quiz(
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Evaluate submitted quiz answers, store score in TopicProgress, and return feedback."""
    try:
        eval_result = content_service.evaluate_quiz(payload.answers)
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err

    student = get_or_create_student(db, payload.username)
    earned_points = eval_result["earned_points"]

    # Persist or update progress
    stmt = select(TopicProgress).where(
        TopicProgress.student_id == student.id,
        TopicProgress.week_number == 1,
        TopicProgress.topic_id == "w1-quiz",
    )
    progress = db.scalar(stmt)
    if not progress:
        progress = TopicProgress(
            student_id=student.id,
            week_number=1,
            topic_id="w1-quiz",
            status="completed" if eval_result["passed"] else "in_progress",
            score=earned_points,
        )
        db.add(progress)
    else:
        # Keep highest earned score
        if earned_points > progress.score:
            progress.score = earned_points
        if eval_result["passed"]:
            progress.status = "completed"

    db.commit()

    return {
        "evaluation": eval_result,
        "recorded_score": progress.score,
        "max_score": eval_result["total_points"],
    }


@router.get("/practice", status_code=status.HTTP_200_OK)
def get_practice() -> dict[str, Any]:
    """Return Week 1 practice task description, domain invariants, and starter template."""
    try:
        return content_service.get_practice()
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post("/practice/submit", status_code=status.HTTP_200_OK)
def submit_practice(
    payload: PracticeSubmitRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Execute student code in RunnerService sandbox, log submission, and update score."""
    student = get_or_create_student(db, payload.username)

    run_result = content_service.run_practice_check(
        student_code=payload.code,
        timeout=settings.runner_timeout,
    )

    passed = run_result.get("passed", False)
    status_str = run_result.get("status", "error")
    output_str = run_result.get("output", "")

    submission = Submission(
        student_id=student.id,
        task_id="w1-practice",
        code=payload.code,
        status=status_str,
        passed=passed,
        output=output_str,
    )
    db.add(submission)

    # Persist practice score (10 points if passed, 0 otherwise)
    stmt = select(TopicProgress).where(
        TopicProgress.student_id == student.id,
        TopicProgress.week_number == 1,
        TopicProgress.topic_id == "w1-practice",
    )
    progress = db.scalar(stmt)
    earned_score = 10 if passed else 0

    if not progress:
        progress = TopicProgress(
            student_id=student.id,
            week_number=1,
            topic_id="w1-practice",
            status="completed" if passed else "failed",
            score=earned_score,
        )
        db.add(progress)
    else:
        if passed:
            progress.score = 10
            progress.status = "completed"

    db.commit()

    return {
        "passed": passed,
        "status": status_str,
        "output": output_str,
        "duration": run_result.get("duration", 0.0),
        "score": progress.score,
        "max_score": 10,
    }


@router.get("/progress", response_model=Week1ProgressResponse, status_code=status.HTTP_200_OK)
def get_progress(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> Week1ProgressResponse:
    """Return student cumulative points and status for Week 1."""
    student = get_or_create_student(db, username)

    stmt = select(TopicProgress).where(
        TopicProgress.student_id == student.id,
        TopicProgress.week_number == 1,
    )
    records = db.scalars(stmt).all()

    quiz_score = 0
    practice_score = 0

    for r in records:
        if r.topic_id == "w1-quiz":
            quiz_score = r.score
        elif r.topic_id == "w1-practice":
            practice_score = r.score

    total_score = quiz_score + practice_score
    is_completed = (quiz_score >= 7) and (practice_score == 10)

    return Week1ProgressResponse(
        username=username,
        quiz_score=quiz_score,
        quiz_max=10,
        practice_score=practice_score,
        practice_max=10,
        total_score=total_score,
        total_max=20,
        is_completed=is_completed,
    )
