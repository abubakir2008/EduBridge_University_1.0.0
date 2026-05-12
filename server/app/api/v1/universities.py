import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.schemas.university import UniversityCreate, UniversityUpdate, UniversityResponse
from app.schemas.stage import StageCreate, StageResponse
from app.services import university_service
from app.services import matching_service

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("", response_model=list[UniversityResponse])
def list_universities(
    country: str | None = Query(None),
    specialty: str | None = Query(None),
    max_cost: int | None = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return university_service.list_universities(db, country, specialty, max_cost)


@router.get("/match", response_model=list[UniversityResponse])
def match(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return matching_service.match_universities(db, current_user)


@router.post("", response_model=UniversityResponse, status_code=201)
def create_university(body: UniversityCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return university_service.create_university(db, body)


@router.get("/{university_id}", response_model=UniversityResponse)
def get_university(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return university_service.get_university_or_404(db, university_id)


@router.patch("/{university_id}", response_model=UniversityResponse)
def update_university(
    university_id: uuid.UUID,
    body: UniversityUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    uni = university_service.get_university_or_404(db, university_id)
    return university_service.update_university(db, uni, body)


@router.delete("/{university_id}", status_code=204)
def delete_university(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    uni = university_service.get_university_or_404(db, university_id)
    university_service.delete_university(db, uni)


@router.get("/{university_id}/stages", response_model=list[StageResponse])
def get_stages(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    uni = university_service.get_university_or_404(db, university_id)
    return uni.stages


@router.post("/{university_id}/stages", response_model=StageResponse, status_code=201)
def create_stage(
    university_id: uuid.UUID,
    body: StageCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return university_service.create_stage(db, university_id, body)
