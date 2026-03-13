from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ContactRequest
from app.schemas import ContactRequestCreateIn, ContactRequestListOut, ContactRequestOut

router = APIRouter(tags=["contact_requests"])


def _serialize_contact_request(row: ContactRequest) -> ContactRequestOut:
    return ContactRequestOut(
        id=row.id,
        reference=row.reference,
        name=row.name,
        phone=row.phone,
        line_id=row.line_id,
        request_type=row.request_type,
        installation_address=row.installation_address,
        size_info=row.size_info,
        message=row.message,
        source=row.source,
        created_at=row.created_at,
    )


@router.get("/contact-requests", response_model=ContactRequestListOut)
def list_contact_requests(
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> ContactRequestListOut:
    rows = db.scalars(
        select(ContactRequest)
        .order_by(ContactRequest.created_at.desc())
        .limit(limit)
    ).all()
    return ContactRequestListOut(items=[_serialize_contact_request(row) for row in rows])


@router.post("/contact-requests", response_model=ContactRequestOut)
def create_contact_request(payload: ContactRequestCreateIn, db: Session = Depends(get_db)) -> ContactRequestOut:
    existing = db.scalar(select(ContactRequest).where(ContactRequest.reference == payload.reference))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Reference already exists")

    row = ContactRequest(
        reference=payload.reference,
        name=payload.name,
        phone=payload.phone,
        line_id=payload.line_id,
        request_type=payload.request_type,
        installation_address=payload.installation_address,
        size_info=payload.size_info,
        message=payload.message,
        source=payload.source,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _serialize_contact_request(row)


@router.delete("/contact-requests/{reference}")
def delete_contact_request(reference: str, db: Session = Depends(get_db)) -> dict[str, str]:
    row = db.scalar(select(ContactRequest).where(ContactRequest.reference == reference))
    if row is None:
        raise HTTPException(status_code=404, detail="Contact request not found")

    db.delete(row)
    db.commit()
    return {"status": "deleted"}
