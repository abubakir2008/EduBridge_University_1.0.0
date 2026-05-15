import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin, get_current_user
from app.models.stage import Stage
from app.models.requirement import Requirement
from app.schemas.stage import StageUpdate, StageResponse, RequirementCreate, RequirementResponse
from app.services.university_service import update_stage, delete_stage

router = APIRouter(prefix="/stages", tags=["stages"])


@router.patch("/{stage_id}", response_model=StageResponse)
def update(stage_id: uuid.UUID, body: StageUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return update_stage(db, stage_id, body)


@router.delete("/{stage_id}", status_code=204)
def delete(stage_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    delete_stage(db, stage_id)


@router.get("/{stage_id}/requirements", response_model=list[RequirementResponse])
def get_requirements(stage_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    stage = db.get(Stage, stage_id)
    if not stage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Этап не найден")
    return stage.requirements


@router.post("/{stage_id}/requirements", response_model=RequirementResponse, status_code=201)
def create_requirement(stage_id: uuid.UUID, body: RequirementCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    stage = db.get(Stage, stage_id)
    if not stage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Этап не найден")
    req = Requirement(
        stage_id=stage_id,
        name=body.name,
        description=body.description,
        type=body.type,
        required=body.is_required,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


@router.delete("/{stage_id}/requirements/{req_id}", status_code=204)
def delete_requirement(stage_id: uuid.UUID, req_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    req = db.query(Requirement).filter(
        Requirement.id == req_id,
        Requirement.stage_id == stage_id,
    ).first()
    if not req:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Требование не найдено")
    db.delete(req)
    db.commit()
