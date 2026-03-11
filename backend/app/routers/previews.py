from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import FloorStyle, Lead, PreviewJob
from app.schemas import PreviewCreateIn, PreviewOut
from app.services.floor_style_catalog import resolve_style_image_path
from app.services.gemini_preview import generate_gemini_floor_preview
from app.services.preview import generate_floor_preview
from app.services.storage import build_public_url, ensure_storage_dirs

router = APIRouter(prefix="/previews", tags=["previews"])


@router.post("", response_model=PreviewOut)
def create_preview(payload: PreviewCreateIn, db: Session = Depends(get_db)) -> PreviewOut:
    job = db.get(PreviewJob, payload.upload_id)
    if not job:
        raise HTTPException(status_code=404, detail="找不到上傳圖片。")

    floor_style = db.get(FloorStyle, payload.floor_style_id)
    if not floor_style:
        raise HTTPException(status_code=404, detail="找不到地板花色。")

    ensure_storage_dirs()
    result_path = settings.storage_root / "results" / f"{job.id}.png"
    mask_path = settings.storage_root / "masks" / f"{job.id}.png"
    note = "此圖為模擬示意，實際效果依現場採光、空間條件與施工方式為準。"
    engine = "opencv"

    try:
        generate_floor_preview(
            original_path=Path(job.original_image_path),
            result_path=result_path,
            mask_path=mask_path,
            colors=(floor_style.primary_color, floor_style.secondary_color, floor_style.accent_color),
            texture_scale=floor_style.texture_scale,
        )

        style_image_path = resolve_style_image_path(floor_style.tone, floor_style.badge)
        if settings.gemini_api_key and style_image_path is not None:
            try:
                generate_gemini_floor_preview(
                    original_path=Path(job.original_image_path),
                    style_reference_path=style_image_path,
                    guide_preview_path=result_path,
                    output_path=result_path,
                    group_code=floor_style.tone,
                    style_code=floor_style.badge,
                )
                note = "此圖由 Gemini AI 生成，已依選定花色重繪地板區域；實際效果仍依現場採光、空間條件與施工方式為準。"
                engine = "gemini"
                print(f"[preview] Gemini rewrite succeeded for job={job.id} style={floor_style.badge}")
            except Exception as gemini_error:
                note = (
                    "目前顯示展示版模擬結果；Gemini AI 重繪未成功，"
                    "已自動退回基礎預覽模式。"
                )
                engine = "opencv"
                print(f"[preview] Gemini rewrite failed for job={job.id}: {gemini_error}")
        elif settings.gemini_api_key and style_image_path is None:
            print(f"[preview] Gemini skipped for job={job.id}: style reference not found.")
        else:
            print(f"[preview] Gemini skipped for job={job.id}: Gemini API key not configured.")
    except Exception as error:
        job.status = "failed"
        job.error_message = str(error)
        db.add(job)
        db.commit()
        raise HTTPException(status_code=500, detail="預覽生成失敗。") from error

    job.floor_style_id = floor_style.id
    job.result_image_path = str(result_path)
    job.mask_image_path = str(mask_path)
    job.status = "completed"
    job.error_message = None
    db.add(job)

    if payload.lead_name or payload.lead_phone or payload.lead_message:
        db.add(
            Lead(
                preview_job_id=job.id,
                name=payload.lead_name,
                phone=payload.lead_phone,
                line_id=payload.lead_line_id,
                message=payload.lead_message,
            )
        )

    db.commit()

    return PreviewOut(
        job_id=job.id,
        status=job.status,
        engine=engine,
        original_url=build_public_url(job.original_image_path),
        result_url=build_public_url(result_path),
        mask_url=build_public_url(mask_path),
        note=note,
    )
