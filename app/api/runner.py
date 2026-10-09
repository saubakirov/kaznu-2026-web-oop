"""Code execution runner API endpoint."""

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from app.services.runner import RunnerService

router = APIRouter(prefix="/api/runner", tags=["Runner"])


class RunCheckRequest(BaseModel):
    """Payload for submitting code and test suite for execution."""

    code: str = Field(..., description="Student Python code to evaluate")
    test_code: str = Field(..., description="Pytest test suite to execute against the code")
    timeout: int | None = Field(default=None, ge=1, le=10, description="Optional timeout in seconds")


class RunCheckResponse(BaseModel):
    """Result of running code in sandbox."""

    passed: bool
    status: str
    output: str
    duration: float


@router.post("/check", response_model=RunCheckResponse, status_code=status.HTTP_200_OK)
def run_check(payload: RunCheckRequest) -> RunCheckResponse:
    """Execute code against pytest suite in an isolated subprocess."""
    service = RunnerService()
    result = service.run_code(
        code=payload.code,
        test_code=payload.test_code,
        timeout=payload.timeout,
    )
    return RunCheckResponse(**result)
