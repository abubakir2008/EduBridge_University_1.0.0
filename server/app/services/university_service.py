import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.university import University
from app.models.stage import Stage
from app.models.requirement import Requirement
from app.schemas.university import UniversityCreate, UniversityUpdate
from app.schemas.stage import StageCreate, StageUpdate


def get_university_or_404(db: Session, university_id: uuid.UUID) -> University:
    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Университет не найден")
    return uni


def list_universities(
    db: Session,
    country: str | None = None,
    specialty: str | None = None,
    max_cost: int | None = None,
) -> list[University]:
    q = db.query(University)
    if country:
        q = q.filter(University.country.ilike(f"%{country}%"))
    if max_cost:
        q = q.filter(University.cost <= max_cost)
    return q.all()


def create_university(db: Session, data: UniversityCreate) -> University:
    uni = University(**data.model_dump())
    db.add(uni)
    db.commit()
    db.refresh(uni)
    return uni


def update_university(db: Session, uni: University, data: UniversityUpdate) -> University:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(uni, field, value)
    db.commit()
    db.refresh(uni)
    return uni


def delete_university(db: Session, uni: University) -> None:
    db.delete(uni)
    db.commit()


def create_stage(db: Session, university_id: uuid.UUID, data: StageCreate) -> Stage:
    get_university_or_404(db, university_id)
    stage = Stage(
        university_id=university_id,
        name=data.name,
        order=data.order,
        description=data.description,
        deadline=data.deadline,
    )
    db.add(stage)
    db.flush()

    if data.requirements:
        for req_data in data.requirements:
            req = Requirement(stage_id=stage.id, **req_data.model_dump())
            db.add(req)

    db.commit()
    db.refresh(stage)
    return stage


def update_stage(db: Session, stage_id: uuid.UUID, data: StageUpdate) -> Stage:
    stage = db.get(Stage, stage_id)
    if not stage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Этап не найден")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(stage, field, value)
    db.commit()
    db.refresh(stage)
    return stage


def delete_stage(db: Session, stage_id: uuid.UUID) -> None:
    stage = db.get(Stage, stage_id)
    if not stage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Этап не найден")
    db.delete(stage)
    db.commit()
