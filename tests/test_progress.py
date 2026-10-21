"""Integration tests for progress summary and export endpoints."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.content_service import get_content_service

client = TestClient(app)


def test_summary_empty() -> None:
    """Verify GET /api/progress/summary returns zeroes for a fresh student."""
    response = client.get("/api/progress/summary?username=fresh_summary_student")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "fresh_summary_student"
    assert len(data["weeks"]) >= 2
    assert data["total_score"] == 0
    assert data["total_max"] > 0
    assert data["completion_percent"] == 0.0


def test_summary_with_scores() -> None:
    """Verify summary aggregates quiz scores after submission."""
    username = "summary_scored_student"
    svc = get_content_service(1)
    full_quiz = svc.get_quiz(mask_answers=False)
    answers = {q["id"]: q["correct_index"] for q in full_quiz["questions"]}

    client.post(
        "/api/week1/quiz/submit",
        json={"username": username, "answers": answers},
    )

    response = client.get(f"/api/progress/summary?username={username}")
    assert response.status_code == 200
    data = response.json()
    w1 = next(w for w in data["weeks"] if w["week"] == 1)
    assert w1["quiz"] == 10
    assert data["total_score"] >= 10


def test_export() -> None:
    """Verify GET /api/progress/export returns compact JSON with all required fields."""
    response = client.get("/api/progress/export?username=export_student")
    assert response.status_code == 200
    data = response.json()
    assert "student" in data
    assert "date" in data
    assert "weeks" in data
    assert "total" in data
    assert "max" in data
    assert "percent" in data
    assert isinstance(data["weeks"], list)
    assert len(data["weeks"]) >= 2
    for w in data["weeks"]:
        assert "week" in w
        assert "quiz" in w
        assert "practice" in w
        assert "lecture_read" in w
