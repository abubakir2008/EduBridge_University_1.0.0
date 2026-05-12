import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.schemas.stage import StageUpdate, StageResponse
from app.services.university_service import update_stage, delete_stage

router = APIRouter(prefix="/stages", tags=["stages"])


@router.patch("/{stage_id}", response_model=StageResponse)
def update(stage_id: uuid.UUID, body: StageUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return update_stage(db, stage_id, body)


@router.delete("/{stage_id}", status_code=204)
def delete(stage_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    delete_stage(db, stage_id)
