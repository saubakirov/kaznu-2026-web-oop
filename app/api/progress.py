"""REST API endpoints for aggregate progress summary and grade export."""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_or_create_student
from app.db.session import get_db
from app.models.course import LectureRead, TopicProgress

router = APIRouter(prefix="/api/progress", tags=["Progress"])

# Week configuration: (week_number, quiz_topic_id, practice_topic_id, quiz_max, practice_max)
WEEK_CONFIG = [
    (1, "w1-quiz", "w1-practice", 10, 10),
    (2, "w2-quiz", "w2-practice", 10, 15),
]


def _build_weeks_data(
    db: Session,
    student_id: int,
) -> list[dict[str, Any]]:
    """Build per-week progress data for all configured weeks."""
    weeks: list[dict[str, Any]] = []

    for week_num, quiz_topic, practice_topic, quiz_max, practice_max in WEEK_CONFIG:
        stmt = select(TopicProgress).where(
            TopicProgress.student_id == student_id,
            TopicProgress.week_number == week_num,
        )
        records = db.scalars(stmt).all()

        quiz_score = 0
        practice_score = 0
        for r in records:
            if r.topic_id == quiz_topic:
                quiz_score = r.score
            elif r.topic_id == practice_topic:
                practice_score = r.score

        lr_stmt = select(LectureRead).where(
            LectureRead.student_id == student_id,
            LectureRead.week_number == week_num,
        )
        lecture_read = db.scalar(lr_stmt) is not None

        weeks.append({
            "week": week_num,
            "quiz": quiz_score,
            "quiz_max": quiz_max,
            "practice": practice_score,
            "practice_max": practice_max,
            "lecture_read": lecture_read,
        })

    return weeks


@router.get("/summary", status_code=status.HTTP_200_OK)
def get_summary(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return aggregate progress across all weeks."""
    student = get_or_create_student(db, username)
    weeks = _build_weeks_data(db, student.id)

    total_score = sum(w["quiz"] + w["practice"] for w in weeks)
    total_max = sum(w["quiz_max"] + w["practice_max"] for w in weeks)
    completion_percent = round(total_score / total_max * 100, 1) if total_max > 0 else 0.0

    return {
        "username": username,
        "weeks": weeks,
        "total_score": total_score,
        "total_max": total_max,
        "completion_percent": completion_percent,
    }


@router.get("/export", status_code=status.HTTP_200_OK)
def get_export(
    username: str = Query(default="default_student", description="Student username"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return compact JSON export of student grades for copy-paste."""
    student = get_or_create_student(db, username)
    weeks = _build_weeks_data(db, student.id)

    total_score = sum(w["quiz"] + w["practice"] for w in weeks)
    total_max = sum(w["quiz_max"] + w["practice_max"] for w in weeks)
    completion_percent = round(total_score / total_max * 100, 1) if total_max > 0 else 0.0

    return {
        "student": username,
        "date": datetime.now(tz=timezone.utc).strftime("%Y-%m-%d"),
        "weeks": [
            {
                "week": w["week"],
                "quiz": w["quiz"],
                "practice": w["practice"],
                "lecture_read": w["lecture_read"],
            }
            for w in weeks
        ],
        "total": total_score,
        "max": total_max,
        "percent": completion_percent,
    }
