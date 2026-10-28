"""Tests for Week 3 educational content structure, completeness, and sandbox verification."""

import json
from pathlib import Path

from app.services.content_service import get_content_service
from app.services.runner import RunnerService


def test_content_files_structure() -> None:
    """Verify that all Week 3 content JSON files exist and adhere to schemas."""
    content_dir = Path("content") / "week3"
    assert content_dir.exists(), "content/week3 directory must exist"

    # 1. Lecture JSON
    lecture_file = content_dir / "lecture.json"
    assert lecture_file.exists(), "lecture.json must exist"
    with open(lecture_file, encoding="utf-8") as f:
        lecture = json.load(f)

    assert lecture["week_number"] == 3
    assert "title" in lecture and len(lecture["title"]) > 5
    assert len(lecture["sections"]) >= 4
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

    assert quiz["week_number"] == 3
    assert len(quiz["questions"]) >= 6
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

    assert practice["week_number"] == 3
    assert practice["max_points"] == 15
    assert len(practice["requirements"]) >= 3
    assert "starter_code" in practice
    assert "test_code" in practice
    assert "reference_solution" in practice
    assert "invariants" in practice


def test_content_reference_solution_runner() -> None:
    """Verify reference solution against official test suite in RunnerService."""
    service = get_content_service(3)
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

class KaspiBankProtocol:
    def execute_payment(self, account: str, amount_kzt: int) -> dict:
        return {"status": "OK", "tx_id": f"KASPI-{amount_kzt}"}

class PaymentProcessor(ABC):
    @abstractmethod
    def process_payment(self, user_id: str, amount: Decimal) -> bool:
        ...

class KaspiBankAdapter(PaymentProcessor):
    def __init__(self, kaspi_api: KaspiBankProtocol) -> None:
        self._api = kaspi_api

    def process_payment(self, user_id: str, amount: Decimal) -> bool:
        # BUG: does not reject amount <= 0
        return self._api.execute_payment(account=user_id, amount_kzt=int(amount)).get("status") == "OK"

class TransactionDecorator(PaymentProcessor):
    def __init__(self, wrapped: PaymentProcessor) -> None:
        self._wrapped = wrapped

    def process_payment(self, user_id: str, amount: Decimal) -> bool:
        return self._wrapped.process_payment(user_id, amount)

class AuditLoggingDecorator(TransactionDecorator):
    def __init__(self, wrapped: PaymentProcessor) -> None:
        super().__init__(wrapped)
        self.log: list[str] = []

    def process_payment(self, user_id: str, amount: Decimal) -> bool:
        # BUG: does not log
        return self._wrapped.process_payment(user_id, amount)

class ValidationHandler(ABC):
    def __init__(self) -> None:
        self._next_handler = None

    def set_next(self, handler):
        self._next_handler = handler
        return handler

    def validate(self, tx: dict) -> bool:
        return True

class StopListHandler(ValidationHandler):
    def __init__(self, blocked_users):
        super().__init__()

    def validate(self, tx: dict) -> bool:
        return True

class LimitCheckHandler(ValidationHandler):
    def __init__(self, max_limit=Decimal("5000")):
        super().__init__()

    def validate(self, tx: dict) -> bool:
        return True

def build_payment_system(bank_protocol=None, blocked_users=None, max_limit=None):
    return ValidationHandler(), AuditLoggingDecorator(KaspiBankAdapter(KaspiBankProtocol()))
"""
    runner = RunnerService()
    service = get_content_service(3)
    test_code = service.get_test_code()

    result = runner.run_code(code=flawed_code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "failed"
