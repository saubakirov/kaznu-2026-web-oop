"""Integration tests for lecture mark-read endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_lecture_read_status_default() -> None:
    """Verify GET /api/week1/lecture/read-status returns False for fresh student."""
    response = client.get("/api/week1/lecture/read-status?username=fresh_reader")
    assert response.status_code == 200
    data = response.json()
    assert data["lecture_read"] is False
    assert data["week_number"] == 1


def test_mark_lecture_read_week1() -> None:
    """Verify POST /api/week1/lecture/mark-read marks and persists read status."""
    username = "reader_w1_01"

    # Mark as read
    response = client.post(f"/api/week1/lecture/mark-read?username={username}")
    assert response.status_code == 200
    data = response.json()
    assert data["lecture_read"] is True
    assert data["week_number"] == 1

    # Verify status persisted
    status_resp = client.get(f"/api/week1/lecture/read-status?username={username}")
    assert status_resp.status_code == 200
    assert status_resp.json()["lecture_read"] is True


def test_mark_lecture_read_idempotent() -> None:
    """Verify marking lecture read twice does not create duplicate records."""
    username = "reader_idempotent_01"
    client.post(f"/api/week1/lecture/mark-read?username={username}")
    client.post(f"/api/week1/lecture/mark-read?username={username}")

    status_resp = client.get(f"/api/week1/lecture/read-status?username={username}")
    assert status_resp.status_code == 200
    assert status_resp.json()["lecture_read"] is True


def test_mark_lecture_read_week2() -> None:
    """Verify POST /api/week2/lecture/mark-read works for Week 2."""
    username = "reader_w2_01"

    response = client.post(f"/api/week2/lecture/mark-read?username={username}")
    assert response.status_code == 200
    data = response.json()
    assert data["lecture_read"] is True
    assert data["week_number"] == 2

    status_resp = client.get(f"/api/week2/lecture/read-status?username={username}")
    assert status_resp.status_code == 200
    assert status_resp.json()["lecture_read"] is True


def test_lecture_read_reflected_in_progress() -> None:
    """Verify lecture read status is reflected in progress endpoint."""
    username = "reader_progress_01"

    # Before marking
    prog_resp = client.get(f"/api/week1/progress?username={username}")
    assert prog_resp.status_code == 200
    assert prog_resp.json()["lecture_read"] is False

    # Mark as read
    client.post(f"/api/week1/lecture/mark-read?username={username}")

    # After marking
    prog_resp = client.get(f"/api/week1/progress?username={username}")
    assert prog_resp.status_code == 200
    assert prog_resp.json()["lecture_read"] is True
