import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.core.limiter import limiter
from app.models.lead import Lead
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
def list_leads(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(Lead).order_by(Lead.created_at.desc()).all()


@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead_status(
    lead_id: uuid.UUID,
    body: LeadStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заявка не найдена")
    lead.status = body.status
    db.commit()
    db.refresh(lead)
    return lead
