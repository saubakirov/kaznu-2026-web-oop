"""Tests for Week 2 educational content structure, completeness, and sandbox verification."""

import json
from pathlib import Path

from app.services.runner import RunnerService
from app.services.week2_content_service import Week2ContentService


def test_content_files_structure() -> None:
    """Verify that all Week 2 content JSON files exist and adhere to schemas."""
    content_dir = Path("content") / "week2"
    assert content_dir.exists(), "content/week2 directory must exist"

    # 1. Lecture JSON
    lecture_file = content_dir / "lecture.json"
    assert lecture_file.exists(), "lecture.json must exist"
    with open(lecture_file, encoding="utf-8") as f:
        lecture = json.load(f)

    assert lecture["week_number"] == 2
    assert "title" in lecture and len(lecture["title"]) > 5
    assert len(lecture["sections"]) >= 5
    for sec in lecture["sections"]:
        assert "title" in sec
        assert "content" in sec
        assert "TODO" not in sec["content"]
        assert "FIXME" not in sec["content"]

    assert len(lecture["diagrams"]) >= 2
    types = [d["type"] for d in lecture["diagrams"]]
    assert "classDiagram" in types
    assert "sequenceDiagram" in types

    # 2. Quiz JSON
    quiz_file = content_dir / "quiz.json"
    assert quiz_file.exists(), "quiz.json must exist"
    with open(quiz_file, encoding="utf-8") as f:
        quiz = json.load(f)

    assert quiz["week_number"] == 2
    assert len(quiz["questions"]) == 8
    total_pts = sum(q["points"] for q in quiz["questions"])
    assert total_pts == 10, f"Expected 10 total quiz points, got {total_pts}"

    for q in quiz["questions"]:
        assert len(q["options"]) >= 3
        assert 0 <= q["correct_index"] < len(q["options"])
        assert len(q["explanation"]) > 10

    # 3. Practice JSON
    practice_file = content_dir / "practice.json"
    assert practice_file.exists(), "practice.json must exist"
    with open(practice_file, encoding="utf-8") as f:
        practice = json.load(f)

    assert practice["week_number"] == 2
    assert len(practice["requirements"]) >= 3
    assert "starter_code" in practice
    assert "test_code" in practice
    assert "reference_solution" in practice
    assert "monolith_code" in practice
    assert "MonolithicAvtobysService" in practice["monolith_code"]

    monolith_lines = practice["monolith_code"].strip().split("\n")
    assert 30 <= len(monolith_lines) <= 100, (
        f"Monolith should be 30-100 lines, got {len(monolith_lines)}"
    )


def test_content_reference_solution_runner() -> None:
    """Verify reference solution against official test suite in RunnerService."""
    service = Week2ContentService()
    ref_code = service.get_reference_solution()
    assert len(ref_code) > 100

    result = service.run_practice_check(student_code=ref_code, timeout=5)
    assert result["passed"] is True, f"Reference solution failed with output:\n{result['output']}"
    assert result["status"] == "passed"
    assert result["duration"] < 5.0
    assert "passed" in result["output"]


def test_content_flawed_solution_runner() -> None:
    """Verify that flawed student code is rejected by tests."""
    flawed_code = """from abc import ABC, abstractmethod
from decimal import Decimal
from datetime import datetime

class FareCalculator(ABC):
    @abstractmethod
    def calculate(self, card_id: str) -> Decimal:
        ...

class StandardFare(FareCalculator):
    def calculate(self, card_id: str) -> Decimal:
        return Decimal("150")

class StudentFare(FareCalculator):
    def calculate(self, card_id: str) -> Decimal:
        return Decimal("75")

class TransactionLogger(ABC):
    @abstractmethod
    def log(self, card_id: str, amount: Decimal) -> None:
        ...

class ConsoleLogger(TransactionLogger):
    def log(self, card_id: str, amount: Decimal) -> None:
        print(f"Transaction: card={card_id}, amount={amount}")

class TripProcessor:
    def __init__(self, calculator: FareCalculator,
                 logger: TransactionLogger) -> None:
        self._calculator = calculator
        self._logger = logger

    def process(self, card_id: str, balance: Decimal,
                last_trip_time: datetime | None = None) -> dict:
        fare = self._calculator.calculate(card_id)
        # BUG: transfer discount not implemented
        new_balance = balance - fare
        self._logger.log(card_id, fare)
        return {"status": "success", "fare": fare, "new_balance": new_balance}

def create_trip_processor(calculator=None, logger=None):
    if calculator is None:
        calculator = StandardFare()
    if logger is None:
        logger = ConsoleLogger()
    return TripProcessor(calculator=calculator, logger=logger)
"""
    runner = RunnerService()
    service = Week2ContentService()
    test_code = service.get_test_code()

    result = runner.run_code(code=flawed_code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "failed"
