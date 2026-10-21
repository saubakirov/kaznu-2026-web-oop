"""FastAPI application entry point, lifespan initialization, and route configuration."""

import logging
import time
import traceback
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.course import router as course_router
from app.api.health import router as health_router
from app.api.progress import router as progress_router
from app.api.runner import router as runner_router
from app.api.week1 import router as week1_router
from app.api.week2 import router as week2_router
from app.core.config import settings
from app.db.session import init_db

logger = logging.getLogger("web_oop")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context initializing resources on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Интерактивная образовательная платформа Web OOP (КазНУ CS2203)",
    lifespan=lifespan,
)

# CORS middleware for local developer flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next: object) -> Response:
    """Log every request/response with duration; print full traceback on unhandled exceptions."""
    start = time.perf_counter()
    try:
        response = await call_next(request)  # type: ignore[misc]
        duration = time.perf_counter() - start
        logger.info("%s %s → %d (%.3fs)", request.method, request.url.path, response.status_code, duration)
        return response  # type: ignore[return-value]
    except Exception:
        duration = time.perf_counter() - start
        logger.error(
            "%s %s → UNHANDLED EXCEPTION (%.3fs)\n%s",
            request.method,
            request.url.path,
            duration,
            traceback.format_exc(),
        )
        raise


# Register API routers
app.include_router(health_router)
app.include_router(course_router)
app.include_router(runner_router)
app.include_router(week1_router)
app.include_router(week2_router)
app.include_router(progress_router)

# Mount frontend zero-build static files if directory exists
frontend_path = Path("frontend")
if frontend_path.exists():
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
