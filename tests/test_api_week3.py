"""Integration tests for Week 3 REST API endpoints, evaluation, and database persistence."""

import uuid
import pytest
from fastapi.testclient import TestClient

from app.db.session import init_db
from app.main import app
from app.services.content_service import get_content_service


@pytest.fixture(autouse=True)
def setup_db() -> None:
    init_db()


week3_content_service = get_content_service(3)
client = TestClient(app)


def test_api_week3_lecture() -> None:
    """Verify GET /api/week3/lecture returns structured lecture sections and diagrams."""
    response = client.get("/api/week3/lecture")
    assert response.status_code == 200
    data = response.json()
    assert data["week_number"] == 3
    assert "title" in data
    assert len(data["sections"]) >= 4
    assert len(data["diagrams"]) >= 2


def test_api_week3_quiz_get() -> None:
    """Verify GET /api/week3/quiz returns questions with masked answers."""
    response = client.get("/api/week3/quiz")
    assert response.status_code == 200
    data = response.json()
    assert len(data["questions"]) >= 6
    for q in data["questions"]:
        assert "question" in q
        assert "options" in q
        assert "points" in q
        assert "correct_index" not in q
        assert "explanation" not in q


def test_api_week3_quiz_submit() -> None:
    """Verify POST /api/week3/quiz/submit evaluates answers and records progress in SQLite."""
    full_quiz = week3_content_service.get_quiz(mask_answers=False)
    answers = {q["id"]: q["correct_index"] for q in full_quiz["questions"]}

    username = f"test_student_w3_quiz_{uuid.uuid4().hex[:8]}"
    response = client.post(
        "/api/week3/quiz/submit",
        json={"username": username, "answers": answers},
    )
    assert response.status_code == 200
    res = response.json()
    assert res["recorded_score"] == 10
    assert res["evaluation"]["passed"] is True
    assert len(res["evaluation"]["details"]) >= 6

    prog_resp = client.get(f"/api/week3/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["quiz_score"] == 10
    assert prog["quiz_max"] == 10


def test_api_week3_practice_get() -> None:
    """Verify GET /api/week3/practice returns assignment description, invariants, and template."""
    response = client.get("/api/week3/practice")
    assert response.status_code == 200
    data = response.json()
    assert "invariants" in data
    assert "requirements" in data
    assert len(data["requirements"]) >= 3
    assert "starter_code" in data
    assert "PaymentProcessor" in data["starter_code"]


def test_api_week3_practice_submit_reference() -> None:
    """Verify POST /api/week3/practice/submit runs reference solution and awards 15 points."""
    username = f"test_student_w3_practice_{uuid.uuid4().hex[:8]}"
    ref_solution = week3_content_service.get_reference_solution()

    response = client.post(
        "/api/week3/practice/submit",
        json={"username": username, "code": ref_solution},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["status"] == "passed"
    assert data["score"] == 15
    assert "passed" in data["output"]

    prog_resp = client.get(f"/api/week3/progress?username={username}")
    assert prog_resp.status_code == 200
    prog = prog_resp.json()
    assert prog["practice_score"] == 15
    assert prog["practice_max"] == 15


def test_api_week3_practice_submit_broken() -> None:
    """Verify POST /api/week3/practice/submit captures test failure without awarding points."""
    username = f"test_student_w3_practice_broken_{uuid.uuid4().hex[:8]}"
    broken_code = "class PaymentProcessor: pass\nclass KaspiBankAdapter: pass\n"

    response = client.post(
        "/api/week3/practice/submit",
        json={"username": username, "code": broken_code},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is False
    assert data["score"] == 0


def test_api_week3_progress_default() -> None:
    """Verify GET /api/week3/progress returns correct structure and defaults."""
    username = f"fresh_student_w3_{uuid.uuid4().hex[:8]}"
    response = client.get(f"/api/week3/progress?username={username}")
    assert response.status_code == 200
    data = response.json()
    assert data["quiz_score"] == 0
    assert data["practice_score"] == 0
    assert data["total_score"] == 0
    assert data["total_max"] == 25
    assert data["is_completed"] is False


def test_api_week3_lecture_read_mark_and_status() -> None:
    """Verify POST and GET endpoints for lecture read status on Week 3."""
    username = f"test_reader_w3_{uuid.uuid4().hex[:8]}"
    status_resp1 = client.get(f"/api/week3/lecture/read-status?username={username}")
    assert status_resp1.status_code == 200
    assert status_resp1.json()["lecture_read"] is False

    mark_resp = client.post(f"/api/week3/lecture/mark-read?username={username}")
    assert mark_resp.status_code == 200
    assert mark_resp.json()["lecture_read"] is True

    status_resp2 = client.get(f"/api/week3/lecture/read-status?username={username}")
    assert status_resp2.status_code == 200
    assert status_resp2.json()["lecture_read"] is True


def test_api_course_overview_week3_ready() -> None:
    """Verify GET /api/course/overview shows Week 3 module and topics as is_ready: True."""
    response = client.get("/api/course/overview")
    assert response.status_code == 200
    data = response.json()
    week3 = next(w for w in data["weeks"] if w["week_number"] == 3)
    assert week3["status"] == "ready_for_content"
    for topic in week3["topics"]:
        assert topic["is_ready"] is True


def test_api_progress_summary_total_max_70() -> None:
    """Verify GET /api/progress/summary reflects all 3 weeks with total_max = 70."""
    username = f"summary_total_{uuid.uuid4().hex[:8]}"
    response = client.get(f"/api/progress/summary?username={username}")
    assert response.status_code == 200
    data = response.json()
    assert len(data["weeks"]) == 3
    assert data["total_max"] == 70


def test_static_integration_week3() -> None:
    """Verify frontend static layout includes Week 3 elements."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.text
    assert "view-week3" in html
    assert "w3-tab-btn-lecture" in html
    assert "w3-tab-btn-quiz" in html
    assert "w3-tab-btn-practice" in html
    assert "w3-practice-code-editor" in html
