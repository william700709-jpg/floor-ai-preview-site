from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.config import settings


def ensure_storage_dirs() -> None:
    for folder in ("uploads", "results", "masks"):
        (settings.storage_root / folder).mkdir(parents=True, exist_ok=True)


async def save_upload_file(file: UploadFile) -> Path:
    ensure_storage_dirs()
    extension = Path(file.filename or "upload.jpg").suffix.lower() or ".jpg"
    file_name = f"{uuid4()}{extension}"
    destination = settings.storage_root / "uploads" / file_name

    content = await file.read()
    destination.write_bytes(content)
    return destination


def build_public_url(file_path: str | Path) -> str:
    file_name = Path(file_path).name
    parent = Path(file_path).parent.name
    return f"/storage/{parent}/{file_name}"
