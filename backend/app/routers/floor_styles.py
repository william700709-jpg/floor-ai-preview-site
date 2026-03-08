from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Depends

from app.database import get_db
from app.models import FloorStyle
from app.schemas import FloorStyleListOut, FloorStyleOut

router = APIRouter(prefix="/floor-styles", tags=["floor-styles"])


@router.get("", response_model=FloorStyleListOut)
def list_floor_styles(db: Session = Depends(get_db)) -> FloorStyleListOut:
    rows = db.scalars(select(FloorStyle).where(FloorStyle.is_active.is_(True)).order_by(FloorStyle.id)).all()
    return FloorStyleListOut(
        items=[
            FloorStyleOut(
                id=row.id,
                key=row.key,
                name=row.name,
                description=row.description,
                tone=row.tone,
                badge=row.badge,
                colors=(row.primary_color, row.secondary_color, row.accent_color),
            )
            for row in rows
        ]
    )
