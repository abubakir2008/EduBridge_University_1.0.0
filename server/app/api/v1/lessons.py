import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.lesson import Lesson
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonResponse])
def list_lessons(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Lesson).order_by(Lesson.order).all()


@router.get("/{lesson_id}", response_model=LessonResponse)
def get_lesson(lesson_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Урок не найден")
    return lesson


@router.post("", response_model=LessonResponse, status_code=201)
def create_lesson(body: LessonCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    lesson = Lesson(**body.model_dump())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.patch("/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    lesson_id: uuid.UUID,
    body: LessonUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Урок не найден")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/{lesson_id}", status_code=204)
def delete_lesson(lesson_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    lesson = db.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Урок не найден")
    db.delete(lesson)
    db.commit()
