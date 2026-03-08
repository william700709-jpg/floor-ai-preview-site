from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class FloorStyle(Base):
    __tablename__ = "floor_styles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    key: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    description: Mapped[str] = mapped_column(Text)
    tone: Mapped[str] = mapped_column(String(80))
    badge: Mapped[str] = mapped_column(String(80))
    primary_color: Mapped[str] = mapped_column(String(20))
    secondary_color: Mapped[str] = mapped_column(String(20))
    accent_color: Mapped[str] = mapped_column(String(20))
    texture_scale: Mapped[float] = mapped_column(Float, default=1.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    preview_jobs: Mapped[list["PreviewJob"]] = relationship(back_populates="floor_style")


class PreviewJob(Base):
    __tablename__ = "preview_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    floor_style_id: Mapped[int | None] = mapped_column(ForeignKey("floor_styles.id"), nullable=True)
    original_image_path: Mapped[str] = mapped_column(Text)
    result_image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    mask_image_path: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="uploaded")
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    floor_style: Mapped[FloorStyle | None] = relationship(back_populates="preview_jobs")
    leads: Mapped[list["Lead"]] = relationship(back_populates="preview_job")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    preview_job_id: Mapped[str | None] = mapped_column(
        ForeignKey("preview_jobs.id"), nullable=True, index=True
    )
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(60), nullable=True)
    line_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    preview_job: Mapped[PreviewJob | None] = relationship(back_populates="leads")
