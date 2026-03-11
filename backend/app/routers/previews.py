from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

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


def _style_reference_candidates(floor_style: FloorStyle) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []

    if floor_style.tone and floor_style.badge:
        candidates.append((floor_style.tone, floor_style.badge))

    if "-" in floor_style.key:
        group_code, style_code = floor_style.key.rsplit("-", 1)
        candidates.append((group_code.upper(), style_code.upper()))

    deduped: list[tuple[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for candidate in candidates:
        normalized = (candidate[0].strip(), candidate[1].strip())
        if normalized not in seen:
            seen.add(normalized)
            deduped.append(normalized)
    return deduped


def _download_style_reference(style_image_url: str, floor_style: FloorStyle) -> Path:
    parsed = urlparse(style_image_url)
    suffix = Path(parsed.path).suffix.lower() or ".jpg"
    file_hash = hashlib.sha1(style_image_url.encode("utf-8")).hexdigest()[:10]
    style_ref_dir = settings.storage_root / "style-refs" / floor_style.tone
    style_ref_dir.mkdir(parents=True, exist_ok=True)
    destination = style_ref_dir / f"{floor_style.badge}-{file_hash}{suffix}"

    if destination.exists():
        return destination

    request = Request(
        style_image_url,
        headers={"User-Agent": "CozyHomeFloorPreview/1.0"},
        method="GET",
    )
    with urlopen(request, timeout=60) as response:
        destination.write_bytes(response.read())

    return destination


@router.post("", response_model=PreviewOut)
def create_preview(payload: PreviewCreateIn, db: Session = Depends(get_db)) -> PreviewOut:
    job = db.get(PreviewJob, payload.upload_id)
    if not job:
        raise HTTPException(status_code=404, detail="找不到上傳圖片。")

    floor_style = db.get(FloorStyle, payload.floor_style_id)
    if not floor_style:
        raise HTTPException(status_code=404, detail="找不到指定的地板花色。")

    ensure_storage_dirs()
    result_path = settings.storage_root / "results" / f"{job.id}.png"
    mask_path = settings.storage_root / "masks" / f"{job.id}.png"
    note = "後端展示版模擬，實際效果依現場採光、空間條件與施工方式為準。"
    engine = "opencv"

    try:
        generate_floor_preview(
            original_path=Path(job.original_image_path),
            result_path=result_path,
            mask_path=mask_path,
            colors=(floor_style.primary_color, floor_style.secondary_color, floor_style.accent_color),
            texture_scale=floor_style.texture_scale,
        )

        style_image_path: Path | None = None
        selected_group_code = floor_style.tone
        selected_style_code = floor_style.badge
        attempted_refs = _style_reference_candidates(floor_style)

        for group_code, style_code in attempted_refs:
            candidate_path = resolve_style_image_path(group_code, style_code)
            if candidate_path is not None:
                style_image_path = candidate_path
                selected_group_code = group_code
                selected_style_code = style_code
                break

        if style_image_path is None and payload.style_image_url:
            try:
                style_image_path = _download_style_reference(payload.style_image_url, floor_style)
                print(
                    f"[preview] Downloaded remote style reference for job={job.id}: "
                    f"{payload.style_image_url} -> {style_image_path}"
                )
            except Exception as remote_error:
                print(f"[preview] Remote style reference download failed for job={job.id}: {remote_error}")

        if settings.gemini_api_key and style_image_path is not None:
            print(
                f"[preview] Gemini attempt job={job.id} style={floor_style.badge} "
                f"model={settings.gemini_model} reference={style_image_path}"
            )
            try:
                generate_gemini_floor_preview(
                    original_path=Path(job.original_image_path),
                    style_reference_path=style_image_path,
                    guide_preview_path=result_path,
                    output_path=result_path,
                    group_code=selected_group_code,
                    style_code=selected_style_code,
                )
                note = "Gemini AI 重繪版，已依花色參考圖重新生成較自然的地板效果。"
                engine = "gemini"
                print(f"[preview] Gemini rewrite succeeded for job={job.id} style={floor_style.badge}")
            except Exception as gemini_error:
                note = "Gemini AI 重繪失敗，已自動退回後端展示版模擬。"
                engine = "opencv"
                print(f"[preview] Gemini rewrite failed for job={job.id}: {gemini_error}")
        elif settings.gemini_api_key and style_image_path is None:
            print(
                f"[preview] Gemini skipped for job={job.id}: style reference not found. "
                f"attempted={attempted_refs} style_image_url={payload.style_image_url}"
            )
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
