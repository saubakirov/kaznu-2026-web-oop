"""Shared Pydantic request/response models for all API modules."""

from pydantic import BaseModel, Field


class QuizSubmitRequest(BaseModel):
    """Payload for submitting quiz answers."""

    username: str = Field(default="default_student", description="Student identifier")
    answers: dict[str, int] = Field(description="Dictionary mapping question ID to chosen option index")


class PracticeSubmitRequest(BaseModel):
    """Payload for submitting Python practice solution."""

    username: str = Field(default="default_student", description="Student identifier")
    code: str = Field(description="Python source code solution")


class WeekProgressResponse(BaseModel):
    """Aggregate progress report for a single week."""

    username: str
    quiz_score: int
    quiz_max: int = 10
    practice_score: int
    practice_max: int = 10
    lecture_read: bool = False
    total_score: int
    total_max: int = 20
    is_completed: bool
