from datetime import datetime

from pydantic import BaseModel, Field


class FloorStyleOut(BaseModel):
    id: int
    key: str
    name: str
    description: str
    tone: str
    badge: str
    colors: tuple[str, str, str]


class FloorStyleListOut(BaseModel):
    items: list[FloorStyleOut]


class UploadOut(BaseModel):
    upload_id: str
    original_url: str
    status: str


class PreviewCreateIn(BaseModel):
    upload_id: str
    floor_style_id: int
    lead_name: str | None = None
    lead_phone: str | None = None
    lead_line_id: str | None = None
    lead_message: str | None = None


class PreviewOut(BaseModel):
    job_id: str
    status: str
    original_url: str
    result_url: str
    mask_url: str
    note: str = Field(
        default="此圖為模擬示意，實際效果依現場採光、空間條件與施工方式為準。"
    )


class LeadCreateIn(BaseModel):
    preview_job_id: str | None = None
    name: str
    phone: str
    line_id: str | None = None
    message: str | None = None


class LeadOut(BaseModel):
    id: str
    preview_job_id: str | None
    name: str | None
    phone: str | None
    line_id: str | None
    message: str | None
    created_at: datetime
