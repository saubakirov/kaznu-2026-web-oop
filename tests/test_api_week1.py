"""Integration tests for Week 1 REST API endpoints, evaluation, and database persistence."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.content_service import content_service

client = TestClient(app)


def test_api_week1_lecture() -> None:
    """Verify GET /api/week1/lecture returns structured lecture sections and diagrams."""
    response = client.get("/api/week1/lecture")
    assert response.status_code == 200
    data = response.json()
    assert data["week_number"] == 1
    assert "title" in data
    assert len(data["sections"]) >= 5
    assert len(data["diagrams"]) >= 2


def test_api_week1_quiz_get() -> None:
    """Verify GET /api/week1/quiz returns questions with masked answers."""
    response = client.get("/api/week1/quiz")
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 6
    for q in data["questions"]:
        assert "question" in q
        assert "options" in q
        assert "points" in q
        # Ensure answers and explanations are masked
        assert "correct_index" not in q
        assert "explanation" not in q


def test_api_week1_quiz_submit() -> None:
    """Verify POST /api/week1/quiz/submit evaluates answers and records progress in SQLite."""
    # Build payload with all correct answers
    full_quiz = content_service.get_quiz(mask_answers=False)
    answers = {q["id"]: q["correct_index"] for q in full_quiz["questions"]}

    username = "test_student_quiz_01"
    response = client.post(
        "/api/week1/quiz/submit",
        json={"username": username, "answers": answers},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["recorded_score"] == 10
    assert res["evaluation"]["passed"] is True
    assert len(res["evaluation"]["details"]) == 6

    # Verify score is reflected in progress endpoint
    prog_resp = client.get(f"/api/week1/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["quiz_score"] == 10
    assert prog["quiz_max"] == 10


def test_api_week1_practice_get() -> None:
    """Verify GET /api/week1/practice returns assignment description and template."""
    response = client.get("/api/week1/practice")
    assert response.status_code == 200
    data = response.json()
    assert "invariants" in data
    assert len(data["invariants"]) >= 5
    assert "starter_code" in data
    assert "TransitCard" in data["starter_code"]


def test_api_week1_practice_submit_reference() -> None:
    """Verify POST /api/week1/practice/submit runs solution in runner and awards points."""
    username = "test_student_practice_01"
    ref_solution = content_service.get_reference_solution()

    response = client.post(
        "/api/week1/practice/submit",
        json={"username": username, "code": ref_solution},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["status"] == "passed"
    assert data["score"] == 10
    assert "passed" in data["output"]

    # Verify progress persistence
    prog_resp = client.get(f"/api/week1/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["practice_score"] == 10
    assert prog["practice_max"] == 10


def test_api_week1_practice_submit_broken() -> None:
    """Verify POST /api/week1/practice/submit captures test failure without awarding points."""
    username = "test_student_practice_02"
    broken_code = "class TransitCard: pass\nclass SingleTripTicket: pass\n"

    response = client.post(
        "/api/week1/practice/submit",
        json={"username": username, "code": broken_code},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is False
    assert data["status"] == "failed"
    assert data["score"] == 0


def test_static_integration() -> None:
    """Verify frontend static layout and module integration."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.text
    assert "view-week1" in html
    assert "tab-btn-lecture" in html
    assert "tab-btn-quiz" in html
    assert "tab-btn-practice" in html
    assert "practice-code-editor" in html
