from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Cozy Home Floor Preview API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cozy_home"
    storage_root: Path = Path("backend/storage")
    cors_origins: list[str] = ["http://127.0.0.1:3000", "http://localhost:3000"]
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.1-flash-image-preview"
    stock_api_key: str | None = None
    finmind_api_token: str | None = None
    finmind_rate_limit_per_hour: int = 580

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PREVIEW_",
        extra="ignore",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: list[str] | str) -> list[str]:
        if isinstance(value, list):
            return value
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                return ["http://127.0.0.1:3000", "http://localhost:3000"]
            if stripped.startswith("["):
                return [item.strip().strip('"') for item in stripped.strip("[]").split(",") if item.strip()]
            return [item.strip() for item in stripped.split(",") if item.strip()]
        return ["http://127.0.0.1:3000", "http://localhost:3000"]


settings = Settings()
