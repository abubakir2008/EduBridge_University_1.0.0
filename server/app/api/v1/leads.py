import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.core.limiter import limiter
from app.models.lead import Lead, LeadStatus
from app.models.lead_history import LeadHistory
from app.models.activity_log import ActivityLog
from app.schemas.lead import LeadCreate, LeadResponse, LeadStatusUpdate

router = APIRouter(prefix="/leads", tags=["leads"])


@router.post("", response_model=LeadResponse, status_code=201)
@limiter.limit("5/minute")
def create_lead(request: Request, body: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**body.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("", response_model=list[LeadResponse])
def list_leads(
    status: Optional[LeadStatus] = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(Lead)
    if status is not None:
        q = q.filter(Lead.status == status)
    return q.order_by(Lead.created_at.desc()).all()


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead_status(
    lead_id: uuid.UUID,
    body: LeadStatusUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заявка не найдена")
    old_status = lead.status
    lead.status = body.status
    history = LeadHistory(
        lead_id=lead_id,
        status=body.status.value,
        changed_by_id=current_user.id,
    )
    log = ActivityLog(
        admin_id=current_user.id,
        entity_type="lead",
        entity_id=lead_id,
        action="status_changed",
        detail=f"{old_status} → {body.status}",
    )
    db.add(history)
    db.add(log)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}/history")
def get_lead_history(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заявка не найдена")
    history = db.query(LeadHistory).filter(LeadHistory.lead_id == lead_id).order_by(LeadHistory.created_at.asc()).all()
    return [
        {"id": str(h.id), "status": h.status, "created_at": h.created_at.isoformat()}
        for h in history
    ]


@router.delete("/{lead_id}", status_code=204)
def delete_lead(
    lead_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заявка не найдена")
    db.delete(lead)
    db.commit()
