import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.favourite import Favourite
from app.models.university import University
from app.schemas.university import UniversityResponse

router = APIRouter(prefix="/favourites", tags=["favourites"])


def _require_student(user: User = Depends(get_current_user)) -> User:
    if user.role == UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Только для студентов")
    return user


@router.get("", response_model=list[UniversityResponse])
def list_favourites(db: Session = Depends(get_db), user: User = Depends(_require_student)):
    favs = db.query(Favourite).filter(Favourite.user_id == user.id).all()
    return [f.university for f in favs]


@router.get("/compare", response_model=list[UniversityResponse])
def compare_favourites(db: Session = Depends(get_db), user: User = Depends(_require_student)):
    favs = db.query(Favourite).filter(Favourite.user_id == user.id).all()
    return [f.university for f in favs]


@router.post("/{university_id}", status_code=201)
def add_favourite(
    university_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(_require_student),
):
    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Университет не найден")

    existing = db.query(Favourite).filter(
        Favourite.user_id == user.id, Favourite.university_id == university_id
    ).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Уже в избранном")

    fav = Favourite(user_id=user.id, university_id=university_id)
    db.add(fav)
    db.commit()
    return {"message": "Добавлено в избранное"}


@router.delete("/{university_id}", status_code=204)
def remove_favourite(
    university_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(_require_student),
):
    fav = db.query(Favourite).filter(
        Favourite.user_id == user.id, Favourite.university_id == university_id
    ).first()
    if not fav:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Не найдено в избранном")
    db.delete(fav)
    db.commit()
