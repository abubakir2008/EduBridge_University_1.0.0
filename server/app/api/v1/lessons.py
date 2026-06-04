import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.lesson import Lesson
from app.models.file import File
from app.schemas.lesson import LessonCreate, LessonUpdate, LessonResponse
from app.services.file_service import stream_file

router = APIRouter(prefix="/lessons", tags=["lessons"])


class PaginatedLessons(BaseModel):
    items: list[LessonResponse]
    total: int
    page: int
    pages: int


@router.get("", response_model=PaginatedLessons)
def list_lessons(
    stage_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    q = db.query(Lesson)
    if stage_id:
        q = q.filter(Lesson.stage_id == stage_id)
    total = q.count()
    items = q.order_by(Lesson.order).offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedLessons(items=items, total=total, page=page, pages=max(1, -(-total // per_page)))


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


@router.get("/{lesson_id}/stream")
def stream_lesson_file(
    lesson_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    lesson = db.get(Lesson, lesson_id)
    if not lesson or not lesson.file_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    record = db.get(File, lesson.file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(record, request.headers.get("range"), cache_control="private, max-age=3600")
