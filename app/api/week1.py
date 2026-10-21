"""REST API endpoints for Week 1 instructional materials, quiz, and practice verification."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_or_create_student
from app.api.schemas import PracticeSubmitRequest, QuizSubmitRequest, WeekProgressResponse
from app.core.config import settings
from app.db.session import get_db
from app.models.course import LectureRead, Submission, TopicProgress
from app.services.content_service import get_content_service

router = APIRouter(prefix="/api/week1", tags=["Week 1"])

_svc = get_content_service(1)


@router.get("/lecture", status_code=status.HTTP_200_OK)
def get_lecture() -> dict[str, Any]:
    """Return Week 1 lecture content, sections, and Mermaid diagrams."""
    try:
        return _svc.get_lecture()
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.get("/quiz", status_code=status.HTTP_200_OK)
def get_quiz() -> dict[str, Any]:
    """Return Week 1 quiz questions without revealing correct answers."""
    try:
        return _svc.get_quiz(mask_answers=True)
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post("/quiz/submit", status_code=status.HTTP_200_OK)
def submit_quiz(
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Evaluate submitted quiz answers, store score in TopicProgress, and return feedback."""
    try:
        eval_result = _svc.evaluate_quiz(payload.answers)
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
        return _svc.get_practice()
    except FileNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err)) from err


@router.post("/practice/submit", status_code=status.HTTP_200_OK)
def submit_practice(
    payload: PracticeSubmitRequest,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Execute student code in RunnerService sandbox, log submission, and update score."""
    student = get_or_create_student(db, payload.username)

    run_result = _svc.run_practice_check(
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
    current_score = 10 if passed else 0

    if not progress:
        progress = TopicProgress(
            student_id=student.id,
            week_number=1,
            topic_id="w1-practice",
            status="completed" if passed else "failed",
            score=current_score,
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
        "current_score": current_score,
        "best_score": progress.score,
        "max_score": 10,
        # Legacy field kept for backward compatibility with existing tests
        "score": progress.score,
    }


@router.get("/progress", response_model=WeekProgressResponse, status_code=status.HTTP_200_OK)
def get_progress(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> WeekProgressResponse:
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

    # Check lecture read status
    lr_stmt = select(LectureRead).where(
        LectureRead.student_id == student.id,
        LectureRead.week_number == 1,
    )
    lecture_read = db.scalar(lr_stmt) is not None

    total_score = quiz_score + practice_score
    is_completed = (quiz_score >= 7) and (practice_score == 10)

    return WeekProgressResponse(
        username=username,
        quiz_score=quiz_score,
        quiz_max=10,
        practice_score=practice_score,
        practice_max=10,
        lecture_read=lecture_read,
        total_score=total_score,
        total_max=20,
        is_completed=is_completed,
    )


@router.post("/lecture/mark-read", status_code=status.HTTP_200_OK)
def mark_lecture_read(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Mark Week 1 lecture as read for the given student."""
    student = get_or_create_student(db, username)
    stmt = select(LectureRead).where(
        LectureRead.student_id == student.id,
        LectureRead.week_number == 1,
    )
    existing = db.scalar(stmt)
    if not existing:
        lr = LectureRead(student_id=student.id, week_number=1)
        db.add(lr)
        db.commit()
    return {"status": "ok", "lecture_read": True, "week_number": 1}


@router.get("/lecture/read-status", status_code=status.HTTP_200_OK)
def get_lecture_read_status(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return lecture read status for Week 1."""
    student = get_or_create_student(db, username)
    stmt = select(LectureRead).where(
        LectureRead.student_id == student.id,
        LectureRead.week_number == 1,
    )
    is_read = db.scalar(stmt) is not None
    return {"lecture_read": is_read, "week_number": 1}
