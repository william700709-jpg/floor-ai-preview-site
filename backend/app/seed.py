from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import FloorStyle
from app.services.floor_style_catalog import (
    build_style_description,
    load_floor_style_catalog,
    palette_for_style,
    style_key,
)


def seed_floor_styles(db: Session) -> None:
    groups = load_floor_style_catalog()
    valid_keys = {
        style_key(group.code, style.code)
        for group in groups
        for style in group.styles
    }

    existing_rows = {
        row.key: row
        for row in db.scalars(select(FloorStyle)).all()
    }

    for group in groups:
        for index, style in enumerate(group.styles):
            key = style_key(group.code, style.code)
            primary, secondary, accent = palette_for_style(group.code, index)
            row = existing_rows.get(key)

            payload = {
                "name": style.name,
                "description": build_style_description(group),
                "tone": group.code,
                "badge": style.code,
                "primary_color": primary,
                "secondary_color": secondary,
                "accent_color": accent,
                "texture_scale": 1.0,
                "is_active": True,
            }

            if row is None:
                db.add(FloorStyle(key=key, **payload))
                continue

            for field, value in payload.items():
                setattr(row, field, value)

        # Keep old non-catalog demo rows hidden from the live selector.
        for key, row in existing_rows.items():
            if key not in valid_keys:
                row.is_active = False

    db.commit()
