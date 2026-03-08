from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Cozy Home Floor Preview API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/cozy_home"
    storage_root: Path = Path("backend/storage")
    cors_origins: list[str] = ["http://127.0.0.1:3000", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PREVIEW_",
        extra="ignore",
    )


settings = Settings()
