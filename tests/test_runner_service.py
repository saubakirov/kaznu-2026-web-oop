"""Tests for RunnerService isolated execution, AST security validation, and timeout handling."""

from fastapi.testclient import TestClient

from app.main import app
from app.services.runner import RunnerService

client = TestClient(app)


def test_runner_service_success() -> None:
    """Verify runner executes passing Python code and test suite."""
    service = RunnerService()
    code = """def add(a: int, b: int) -> int:
    return a + b
"""
    test_code = """from solution import add

def test_add_positive():
    assert add(2, 3) == 5

def test_add_zero():
    assert add(0, 0) == 0
"""
    result = service.run_code(code=code, test_code=test_code, timeout=5)
    assert result["passed"] is True
    assert result["status"] == "passed"
    assert "2 passed" in result["output"]
    assert result["duration"] > 0


def test_runner_service_failure() -> None:
    """Verify runner captures assertion failures correctly."""
    service = RunnerService()
    code = """def multiply(a: int, b: int) -> int:
    return a + b  # Intentional bug
"""
    test_code = """from solution import multiply

def test_multiply():
    assert multiply(2, 3) == 6
"""
    result = service.run_code(code=code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "failed"
    assert "FAILED" in result["output"]


def test_runner_syntax_error() -> None:
    """Verify AST validation catches Python syntax errors before subprocess launch."""
    service = RunnerService()
    broken_code = "def broken(:\n    pass"
    test_code = "def test_ok(): pass"

    result = service.run_code(code=broken_code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "syntax_error"
    assert "SyntaxError" in result["output"]


def test_runner_forbidden_modules() -> None:
    """Verify AST validation forbids unsafe modules like subprocess or socket."""
    service = RunnerService()
    unsafe_code = """import subprocess

def hack():
    subprocess.run(["dir"])
"""
    test_code = "def test_hack(): pass"

    result = service.run_code(code=unsafe_code, test_code=test_code, timeout=5)
    assert result["passed"] is False
    assert result["status"] == "forbidden"
    assert "Forbidden module import" in result["output"]


def test_runner_timeout_infinite_loop() -> None:
    """Verify infinite loop is safely terminated by subprocess timeout."""
    service = RunnerService()
    infinite_code = """def hang_forever():
    while True:
        pass
"""
    test_code = """from solution import hang_forever

def test_hang():
    hang_forever()
"""
    # Use a short timeout of 1 second for fast test execution
    result = service.run_code(code=infinite_code, test_code=test_code, timeout=1)
    assert result["passed"] is False
    assert result["status"] == "timeout"
    assert "timed out after 1s" in result["output"]


def test_runner_api_endpoint() -> None:
    """Verify POST /api/runner/check returns structured response via TestClient."""
    payload = {
        "code": "class Passenger:\n    def __init__(self, name: str):\n        self.name = name\n",
        "test_code": "from solution import Passenger\n\ndef test_passenger():\n    p = Passenger('Asel')\n    assert p.name == 'Asel'\n",
        "timeout": 5,
    }
    response = client.post("/api/runner/check", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["passed"] is True
    assert data["status"] == "passed"
    assert "1 passed" in data["output"]
