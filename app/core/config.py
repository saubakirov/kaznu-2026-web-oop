"""Application settings and global configuration."""

from pathlib import Path
from pydantic import BaseModel


class Settings(BaseModel):
    """Runtime configuration settings."""

    app_name: str = "Web OOP Platform"
    app_version: str = "0.1.0"
    debug: bool = False
    data_dir: Path = Path("data")
    database_url: str = "sqlite:///data/web_oop.db"
    runner_timeout: int = 5
    static_dir: Path = Path("frontend")


settings = Settings()
