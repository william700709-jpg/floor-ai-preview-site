from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.database import get_db
from app.models import FloorStyle
from app.schemas import FloorStyleGroupOut, FloorStyleListOut, FloorStyleOut, FloorStyleSpecOut
from app.services.floor_style_catalog import (
    load_floor_style_catalog,
    resolve_group_cover_url,
    resolve_style_image_url,
    style_key,
)

router = APIRouter(prefix="/floor-styles", tags=["floor-styles"])


@router.get("", response_model=FloorStyleListOut)
def list_floor_styles(db: Session = Depends(get_db)) -> FloorStyleListOut:
    rows = db.scalars(select(FloorStyle).where(FloorStyle.is_active.is_(True)).order_by(FloorStyle.id)).all()
    row_map = {row.key: row for row in rows}

    groups_out: list[FloorStyleGroupOut] = []
    flat_items: list[FloorStyleOut] = []

    for group in load_floor_style_catalog():
        group_items: list[FloorStyleOut] = []

        for style in group.styles:
            row = row_map.get(style_key(group.code, style.code))
            if row is None:
                continue

            item = FloorStyleOut(
                id=row.id,
                key=row.key,
                code=style.code,
                name=style.name,
                description=row.description,
                tone=row.tone,
                badge=row.badge,
                group_code=group.code,
                group_name=group.name,
                image_url=resolve_style_image_url(group.code, style.code),
                colors=(row.primary_color, row.secondary_color, row.accent_color),
            )
            group_items.append(item)
            flat_items.append(item)

        groups_out.append(
            FloorStyleGroupOut(
                code=group.code,
                name=group.name,
                description=group.description,
                cover_url=resolve_group_cover_url(group.code),
                spec=FloorStyleSpecOut(**group.spec),
                styles=group_items,
            )
        )

    return FloorStyleListOut(items=flat_items, groups=groups_out)
