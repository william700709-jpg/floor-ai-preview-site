from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Lead
from app.schemas import LeadCreateIn, LeadOut

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadOut)
def create_lead(payload: LeadCreateIn, db: Session = Depends(get_db)) -> LeadOut:
    lead = Lead(
        preview_job_id=payload.preview_job_id,
        name=payload.name,
        phone=payload.phone,
        line_id=payload.line_id,
        message=payload.message,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    return LeadOut(
        id=lead.id,
        preview_job_id=lead.preview_job_id,
        name=lead.name,
        phone=lead.phone,
        line_id=lead.line_id,
        message=lead.message,
        created_at=lead.created_at,
    )
