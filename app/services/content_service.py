"""Content loading, quiz evaluation, and practice validation service.

Parametric service: ContentService(week_number) handles any week's content
from the corresponding content/weekN/ directory.
"""

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.services.runner import RunnerService

CONTENT_BASE = Path("content")


class ContentService:
    """Service managing educational content and evaluation logic for a given week."""

    def __init__(
        self,
        week_number: int = 1,
        content_dir: Path | None = None,
        runner: RunnerService | None = None,
    ) -> None:
        self.week_number = week_number
        self.content_dir = content_dir or (CONTENT_BASE / f"week{week_number}")
        self.runner = runner or RunnerService()

    def _load_json(self, filename: str) -> dict[str, Any]:
        """Load and return parsed JSON from content directory."""
        filepath = self.content_dir / filename
        if not filepath.exists():
            raise FileNotFoundError(f"Content not found at {filepath}")
        with open(filepath, encoding="utf-8") as f:
            return json.load(f)

    def get_lecture(self) -> dict[str, Any]:
        """Load and return structured lecture content and diagrams."""
        return self._load_json("lecture.json")

    def get_quiz(self, mask_answers: bool = True) -> dict[str, Any]:
        """Load quiz questions.

        If mask_answers is True, hides correct_index and explanation from students.
        """
        data = self._load_json("quiz.json")

        if not mask_answers:
            return data

        sanitized_questions = []
        for q in data.get("questions", []):
            sanitized_questions.append({
                "id": q["id"],
                "question": q["question"],
                "options": q["options"],
                "points": q["points"],
            })

        return {
            "week_number": data.get("week_number", self.week_number),
            "title": data.get("title", ""),
            "max_points": data.get("max_points", 10),
            "questions": sanitized_questions,
        }

    def evaluate_quiz(self, student_answers: dict[str, int]) -> dict[str, Any]:
        """Evaluate submitted quiz answers against reference answers.

        Returns earned score, details per question, and explanations.
        """
        full_quiz = self.get_quiz(mask_answers=False)
        questions = full_quiz.get("questions", [])

        earned_points = 0
        total_points = 0
        details = []

        for q in questions:
            q_id = q["id"]
            pts = q["points"]
            total_points += pts
            correct_idx = q["correct_index"]
            chosen_idx = student_answers.get(q_id)

            is_correct = chosen_idx == correct_idx
            if is_correct:
                earned_points += pts

            details.append({
                "id": q_id,
                "question": q["question"],
                "chosen_index": chosen_idx,
                "correct_index": correct_idx,
                "is_correct": is_correct,
                "points_awarded": pts if is_correct else 0,
                "max_points": pts,
                "explanation": q["explanation"],
            })

        return {
            "week_number": full_quiz.get("week_number", self.week_number),
            "earned_points": earned_points,
            "total_points": total_points,
            "passed": earned_points >= int(total_points * 0.7),
            "details": details,
        }

    def get_practice(self) -> dict[str, Any]:
        """Load practice problem statement and all available fields."""
        data = self._load_json("practice.json")

        result: dict[str, Any] = {
            "week_number": data.get("week_number", self.week_number),
            "title": data.get("title", ""),
            "max_points": data.get("max_points", 10),
            "description": data.get("description", ""),
            "starter_code": data.get("starter_code", ""),
        }

        # Week-specific fields — pass through any extra keys the JSON provides
        for key in ("invariants", "monolith_code", "requirements"):
            if key in data:
                result[key] = data[key]

        return result

    def get_reference_solution(self) -> str:
        """Return reference solution code for practice."""
        data = self._load_json("practice.json")
        return data.get("reference_solution", "")

    def get_test_code(self) -> str:
        """Return test suite code for practice."""
        data = self._load_json("practice.json")
        return data.get("test_code", "")

    def run_practice_check(self, student_code: str, timeout: int = 5) -> dict[str, Any]:
        """Execute student code against official test suite in RunnerService."""
        test_code = self.get_test_code()
        return self.runner.run_code(code=student_code, test_code=test_code, timeout=timeout)


@lru_cache(maxsize=4)
def get_content_service(week_number: int) -> ContentService:
    """Return a cached ContentService instance for the given week."""
    return ContentService(week_number=week_number)


# Legacy aliases for backward compatibility with imports
content_service = get_content_service(1)
