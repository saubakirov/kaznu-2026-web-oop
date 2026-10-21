"""Content loading, quiz evaluation, and practice validation service for Week 2."""

import json
from pathlib import Path
from typing import Any

from app.services.runner import RunnerService

CONTENT_DIR = Path("content") / "week2"


class Week2ContentService:
    """Service managing educational content and evaluation logic for Week 2 (SOLID & DI)."""

    def __init__(self, content_dir: Path | None = None, runner: RunnerService | None = None) -> None:
        self.content_dir = content_dir or CONTENT_DIR
        self.runner = runner or RunnerService()

    def get_lecture(self) -> dict[str, Any]:
        """Load and return structured lecture content and diagrams."""
        lecture_file = self.content_dir / "lecture.json"
        if not lecture_file.exists():
            raise FileNotFoundError(f"Lecture content not found at {lecture_file}")
        with open(lecture_file, encoding="utf-8") as f:
            return json.load(f)

    def get_quiz(self, mask_answers: bool = True) -> dict[str, Any]:
        """Load quiz questions.

        If mask_answers is True, hides correct_index and explanation from students.
        """
        quiz_file = self.content_dir / "quiz.json"
        if not quiz_file.exists():
            raise FileNotFoundError(f"Quiz content not found at {quiz_file}")
        with open(quiz_file, encoding="utf-8") as f:
            data = json.load(f)

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
            "week_number": data.get("week_number", 2),
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
            "week_number": full_quiz.get("week_number", 2),
            "earned_points": earned_points,
            "total_points": total_points,
            "passed": earned_points >= int(total_points * 0.7),
            "details": details,
        }

    def get_practice(self) -> dict[str, Any]:
        """Load practice problem statement, monolith code, requirements, and starter template."""
        practice_file = self.content_dir / "practice.json"
        if not practice_file.exists():
            raise FileNotFoundError(f"Practice content not found at {practice_file}")
        with open(practice_file, encoding="utf-8") as f:
            data = json.load(f)

        return {
            "week_number": data.get("week_number", 2),
            "title": data.get("title", ""),
            "max_points": data.get("max_points", 15),
            "description": data.get("description", ""),
            "monolith_code": data.get("monolith_code", ""),
            "requirements": data.get("requirements", []),
            "starter_code": data.get("starter_code", ""),
        }

    def get_reference_solution(self) -> str:
        """Return reference solution code for practice."""
        practice_file = self.content_dir / "practice.json"
        with open(practice_file, encoding="utf-8") as f:
            data = json.load(f)
        return data.get("reference_solution", "")

    def get_test_code(self) -> str:
        """Return test suite code for practice."""
        practice_file = self.content_dir / "practice.json"
        with open(practice_file, encoding="utf-8") as f:
            data = json.load(f)
        return data.get("test_code", "")

    def run_practice_check(self, student_code: str, timeout: int = 5) -> dict[str, Any]:
        """Execute student code against official test suite in RunnerService."""
        test_code = self.get_test_code()
        return self.runner.run_code(code=student_code, test_code=test_code, timeout=timeout)


week2_content_service = Week2ContentService()
