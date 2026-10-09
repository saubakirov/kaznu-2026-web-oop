"""Integration tests for FastAPI health endpoints and static frontend serving."""

import pytest
from fastapi.testclient import TestClient

from app.db.session import init_db
from app.main import app


@pytest.fixture(autouse=True)
def setup_db() -> None:
    init_db()


client = TestClient(app)


def test_health_endpoint() -> None:
    """Verify GET /api/health returns 200 OK and database connectivity."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "Web OOP Platform"
    assert data["database"] == "connected"
    assert "version" in data


def test_course_overview_endpoint() -> None:
    """Verify GET /api/course/overview returns the 3-week syllabus structure."""
    response = client.get("/api/course/overview")
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "CS2203"
    assert data["total_weeks"] == 3
    assert len(data["weeks"]) == 3
    assert data["weeks"][0]["status"] == "ready_for_content"
    assert len(data["weeks"][0]["topics"]) == 3


def test_static_root_serves_html() -> None:
    """Verify root / serves frontend index.html."""
    response = client.get("/")
    assert response.status_code == 200
    assert "Web OOP — КазНУ CS2203" in response.text
    assert "Tailwind CSS CDN" in response.text
    assert "mermaid" in response.text


def test_static_assets_served() -> None:
    """Verify static assets are reachable."""
    css_res = client.get("/css/styles.css")
    assert css_res.status_code == 200
    assert "status-badge" in css_res.text

    js_res = client.get("/js/app.js")
    assert js_res.status_code == 200
    assert "setupRunnerSmokeTest" in js_res.text
