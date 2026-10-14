"""Tests for Week 1 educational content structure, completeness, and sandbox verification."""

import json
from pathlib import Path

from app.services.content_service import ContentService
from app.services.runner import RunnerService


def test_content_files_structure() -> None:
    """Verify that all Week 1 content JSON files exist and adhere to schemas."""
    content_dir = Path("content") / "week1"
    assert content_dir.exists(), "content/week1 directory must exist"

    # 1. Lecture JSON
    lecture_file = content_dir / "lecture.json"
    assert lecture_file.exists(), "lecture.json must exist"
    with open(lecture_file, encoding="utf-8") as f:
        lecture = json.load(f)

    assert lecture["week_number"] == 1
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

    assert quiz["week_number"] == 1
    assert len(quiz["questions"]) == 6
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

    assert practice["week_number"] == 1
    assert len(practice["invariants"]) >= 5
    assert "starter_code" in practice
    assert "test_code" in practice
    assert "reference_solution" in practice


def test_content_reference_solution_runner() -> None:
    """Verify reference solution against official test suite in RunnerService."""
    service = ContentService()
    ref_code = service.get_reference_solution()
    assert len(ref_code) > 100

    result = service.run_practice_check(student_code=ref_code, timeout=5)
    assert result["passed"] is True, f"Reference solution failed with output:\n{result['output']}"
    assert result["status"] == "passed"
    assert result["duration"] < 5.0
    assert "passed" in result["output"]


def test_content_flawed_solution_runner() -> None:
    """Verify that flawed student code (e.g., negative balance allowed) is rejected by tests."""
    flawed_code = """from datetime import datetime
from decimal import Decimal

class DomainError(Exception): pass
class InsufficientFundsError(DomainError): pass
class CardBlockedError(DomainError): pass
class TicketAlreadyUsedError(DomainError): pass
class TicketExpiredError(DomainError): pass

class TransitCard:
    def __init__(self, card_id: str, balance: Decimal = Decimal("0.00"), is_blocked: bool = False):
        self._card_id = card_id
        self._balance = Decimal(str(balance)) # Flaw: Does not check balance >= 0
        self._is_blocked = is_blocked

    @property
    def card_id(self) -> str: return self._card_id
    @property
    def balance(self) -> Decimal: return self._balance
    @property
    def is_blocked(self) -> bool: return self._is_blocked
    def deposit(self, amount: Decimal) -> None: self._balance += Decimal(str(amount))
    def pay(self, fare: Decimal) -> None: self._balance -= Decimal(str(fare))
    def block(self) -> None: self._is_blocked = True
    def unblock(self) -> None: self._is_blocked = False

class SingleTripTicket:
    def __init__(self, ticket_id: str, valid_until: datetime, price: Decimal = Decimal("120.00"), is_used: bool = False):
        self._ticket_id = ticket_id
        self._valid_until = valid_until
        self._price = price
        self._is_used = is_used
    @property
    def ticket_id(self) -> str: return self._ticket_id
    @property
    def price(self) -> Decimal: return self._price
    @property
    def valid_until(self) -> datetime: return self._valid_until
    @property
    def is_used(self) -> bool: return self._is_used
    def validate(self, current_time: datetime) -> None: self._is_used = True
"""
    runner = RunnerService()
    content_svc = ContentService()
    test_code = content_svc.get_test_code()

    result = runner.run_code(code=flawed_code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "failed"
