"""Integration tests for Week 2 REST API endpoints, evaluation, and database persistence."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.week2_content_service import week2_content_service

client = TestClient(app)


def test_api_week2_lecture() -> None:
    """Verify GET /api/week2/lecture returns structured lecture sections and diagrams."""
    response = client.get("/api/week2/lecture")
    assert response.status_code == 200
    data = response.json()
    assert data["week_number"] == 2
    assert "title" in data
    assert len(data["sections"]) >= 5
    assert len(data["diagrams"]) >= 2


def test_api_week2_quiz_get() -> None:
    """Verify GET /api/week2/quiz returns questions with masked answers."""
    response = client.get("/api/week2/quiz")
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) == 8
    for q in data["questions"]:
        assert "question" in q
        assert "options" in q
        assert "points" in q
        assert "correct_index" not in q
        assert "explanation" not in q


def test_api_week2_quiz_submit() -> None:
    """Verify POST /api/week2/quiz/submit evaluates answers and records progress in SQLite."""
    full_quiz = week2_content_service.get_quiz(mask_answers=False)
    answers = {q["id"]: q["correct_index"] for q in full_quiz["questions"]}

    username = "test_student_w2_quiz_01"
    response = client.post(
        "/api/week2/quiz/submit",
        json={"username": username, "answers": answers},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["recorded_score"] == 10
    assert res["evaluation"]["passed"] is True
    assert len(res["evaluation"]["details"]) == 8

    prog_resp = client.get(f"/api/week2/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["quiz_score"] == 10
    assert prog["quiz_max"] == 10


def test_api_week2_practice_get() -> None:
    """Verify GET /api/week2/practice returns assignment description, monolith, and template."""
    response = client.get("/api/week2/practice")
    assert response.status_code == 200
    data = response.json()
    assert "monolith_code" in data
    assert "MonolithicAvtobysService" in data["monolith_code"]
    assert "requirements" in data
    assert len(data["requirements"]) >= 3
    assert "starter_code" in data
    assert "FareCalculator" in data["starter_code"]


def test_api_week2_practice_submit_reference() -> None:
    """Verify POST /api/week2/practice/submit runs reference solution and awards 15 points."""
    username = "test_student_w2_practice_01"
    ref_solution = week2_content_service.get_reference_solution()

    response = client.post(
        "/api/week2/practice/submit",
        json={"username": username, "code": ref_solution},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["status"] == "passed"
    assert data["score"] == 15
    assert "passed" in data["output"]

    prog_resp = client.get(f"/api/week2/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["practice_score"] == 15
    assert prog["practice_max"] == 15


def test_api_week2_practice_submit_broken() -> None:
    """Verify POST /api/week2/practice/submit captures test failure without awarding points."""
    username = "test_student_w2_practice_02"
    broken_code = "class FareCalculator: pass\nclass StandardFare: pass\n"

    response = client.post(
        "/api/week2/practice/submit",
        json={"username": username, "code": broken_code},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is False
    assert data["score"] == 0


def test_api_week2_progress_default() -> None:
    """Verify GET /api/week2/progress returns correct structure and defaults."""
    response = client.get("/api/week2/progress?username=fresh_student_w2")
    assert response.status_code == 200
    data = response.json()
    assert data["quiz_score"] == 0
    assert data["practice_score"] == 0
    assert data["total_score"] == 0
    assert data["total_max"] == 25
    assert data["is_completed"] is False


def test_api_course_overview_week2_ready() -> None:
    """Verify GET /api/course/overview shows Week 2 topics as is_ready: True."""
    response = client.get("/api/course/overview")
    assert response.status_code == 200
    data = response.json()
    week2 = next(w for w in data["weeks"] if w["week_number"] == 2)
    assert week2["subtitle"] == "Принципы SOLID и Dependency Injection"
    for topic in week2["topics"]:
        assert topic["is_ready"] is True


def test_static_integration_week2() -> None:
    """Verify frontend static layout includes Week 2 elements."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.text
    assert "view-week2" in html
    assert "w2-tab-btn-lecture" in html
    assert "w2-tab-btn-quiz" in html
    assert "w2-tab-btn-practice" in html
    assert "w2-practice-code-editor" in html
