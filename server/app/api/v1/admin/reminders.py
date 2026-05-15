import uuid
from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.reminder import Reminder
from app.models.user import User

router = APIRouter(prefix="/admin/reminders", tags=["admin"])


class ReminderCreate(BaseModel):
    text: str
    student_id: Optional[uuid.UUID] = None
    due_date: Optional[date] = None


class ReminderResponse(BaseModel):
    id: uuid.UUID
    text: str
    student_id: Optional[uuid.UUID]
    student_name: Optional[str]
    due_date: Optional[str]
    is_done: bool
    created_at: str

    model_config = {"from_attributes": True}


@router.get("", response_model=list[ReminderResponse])
def list_reminders(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    reminders = (
        db.query(Reminder)
        .filter(Reminder.admin_id == current_user.id)
        .order_by(Reminder.is_done.asc(), Reminder.due_date.asc().nullslast(), Reminder.created_at.desc())
        .all()
    )
    result = []
    for r in reminders:
        student = db.get(User, r.student_id) if r.student_id else None
        result.append(ReminderResponse(
            id=r.id,
            text=r.text,
            student_id=r.student_id,
            student_name=student.full_name if student else None,
            due_date=r.due_date.isoformat() if r.due_date else None,
            is_done=r.is_done,
            created_at=r.created_at.isoformat(),
        ))
    return result


@router.post("", response_model=ReminderResponse, status_code=201)
def create_reminder(body: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    reminder = Reminder(
        admin_id=current_user.id,
        student_id=body.student_id,
        text=body.text.strip(),
        due_date=body.due_date,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    student = db.get(User, reminder.student_id) if reminder.student_id else None
    return ReminderResponse(
        id=reminder.id,
        text=reminder.text,
        student_id=reminder.student_id,
        student_name=student.full_name if student else None,
        due_date=reminder.due_date.isoformat() if reminder.due_date else None,
        is_done=reminder.is_done,
        created_at=reminder.created_at.isoformat(),
    )


@router.patch("/{reminder_id}/done", response_model=ReminderResponse)
def toggle_done(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.admin_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Напоминание не найдено")
    reminder.is_done = not reminder.is_done
    db.commit()
    db.refresh(reminder)
    student = db.get(User, reminder.student_id) if reminder.student_id else None
    return ReminderResponse(
        id=reminder.id,
        text=reminder.text,
        student_id=reminder.student_id,
        student_name=student.full_name if student else None,
        due_date=reminder.due_date.isoformat() if reminder.due_date else None,
        is_done=reminder.is_done,
        created_at=reminder.created_at.isoformat(),
    )


@router.delete("/{reminder_id}", status_code=204)
def delete_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.admin_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Напоминание не найдено")
    db.delete(reminder)
    db.commit()
