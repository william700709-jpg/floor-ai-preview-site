from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PreviewJob
from app.schemas import UploadOut
from app.services.storage import build_public_url, save_upload_file

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("", response_model=UploadOut)
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> UploadOut:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png"}:
        raise HTTPException(status_code=400, detail="只接受 jpg、jpeg、png 圖片。")

    saved_path = await save_upload_file(file)
    job = PreviewJob(original_image_path=str(saved_path), status="uploaded")
    db.add(job)
    db.commit()
    db.refresh(job)

    return UploadOut(
        upload_id=job.id,
        original_url=build_public_url(saved_path),
        status=job.status,
    )
