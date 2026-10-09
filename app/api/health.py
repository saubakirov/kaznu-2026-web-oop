"""Health check and platform status endpoint."""

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db

router = APIRouter(prefix="/api", tags=["Health"])


class HealthResponse(BaseModel):
    """Response schema for the system health check."""

    status: str
    app: str
    version: str
    database: str


@router.get("/health", response_model=HealthResponse, status_code=status.HTTP_200_OK)
def get_health(db: Session = Depends(get_db)) -> HealthResponse:
    """Check backend service liveness and database connectivity."""
    db_status = "disconnected"
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "error"

    return HealthResponse(
        status="ok",
        app=settings.app_name,
        version=settings.app_version,
        database=db_status,
    )
