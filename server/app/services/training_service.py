import uuid
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.student_requirement import StudentRequirement
from app.models.student_note import StudentNote
from app.models.stage import Stage
from app.models.requirement import Requirement
from app.models.university import University
from app.models.user import User
from app.services import notification_service


def get_progress_or_404(db: Session, user_id: uuid.UUID) -> StudentProgress:
    progress = db.query(StudentProgress).filter(StudentProgress.user_id == user_id).first()
    if not progress:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Прогресс не найден")
    return progress


def start_training(db: Session, user: User, university_id: uuid.UUID) -> StudentProgress:
    existing = db.query(StudentProgress).filter(
        StudentProgress.user_id == user.id,
        StudentProgress.status == ProgressStatus.in_progress,
    ).first()
    if existing:
        if existing.university_id == university_id:
            return existing
        raise HTTPException(status.HTTP_409_CONFLICT, "Обучение уже начато в другом университете")

    uni = db.get(University, university_id)
    if not uni:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Университет не найден")

    first_stage = (
        db.query(Stage)
        .filter(Stage.university_id == university_id)
        .order_by(Stage.order)
        .first()
    )

    progress = StudentProgress(
        user_id=user.id,
        university_id=university_id,
        current_stage_id=first_stage.id if first_stage else None,
        status=ProgressStatus.in_progress,
    )
    db.add(progress)
    db.flush()

    if first_stage:
        _create_student_requirements(db, progress.id, first_stage.id)
        notification_service.notify_new_stage(db, user, first_stage.name)

    db.commit()
    db.refresh(progress)
    return progress


def cancel_training(db: Session, user: User) -> None:
    progress = db.query(StudentProgress).filter(
        StudentProgress.user_id == user.id,
        StudentProgress.status == ProgressStatus.in_progress,
    ).first()
    if not progress:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Активное обучение не найдено")
    db.delete(progress)
    db.commit()


def complete_requirement(
    db: Session,
    user: User,
    progress: StudentProgress,
    requirement_id: uuid.UUID,
    file_id: uuid.UUID | None,
) -> StudentRequirement:
    sr = db.query(StudentRequirement).filter(
        StudentRequirement.student_progress_id == progress.id,
        StudentRequirement.requirement_id == requirement_id,
    ).first()
    if not sr:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Требование не найдено в текущем прогрессе")

    sr.completed = True
    sr.completed_at = datetime.now(timezone.utc)
    if file_id:
        sr.file_id = file_id
    db.commit()
    db.refresh(sr)
    return sr


def advance_stage(db: Session, user: User, progress: StudentProgress) -> StudentProgress:
    if not progress.current_stage_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Нет активного этапа")

    # Принудительное прохождение уроков: нельзя дальше, пока не просмотрены все уроки этапа
    from app.models.lesson import Lesson
    from app.models.lesson_view import LessonView
    stage_lessons = db.query(Lesson).filter(Lesson.stage_id == progress.current_stage_id).all()
    if stage_lessons:
        viewed_ids = {
            row[0] for row in db.query(LessonView.lesson_id).filter(
                LessonView.user_id == user.id,
                LessonView.lesson_id.in_([l.id for l in stage_lessons]),
            ).all()
        }
        unseen = [l.title for l in stage_lessons if l.id not in viewed_ids]
        if unseen:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Сначала посмотрите уроки: {', '.join(unseen)}",
            )

    incomplete = db.query(StudentRequirement).join(Requirement).filter(
        StudentRequirement.student_progress_id == progress.id,
        StudentRequirement.completed == False,  # noqa: E712
        Requirement.required == True,
        StudentRequirement.requirement_id.in_(
            db.query(Requirement.id).filter(Requirement.stage_id == progress.current_stage_id)
        ),
    ).all()

    if incomplete:
        names = [sr.requirement.name for sr in incomplete]
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            f"Не выполнены обязательные требования: {', '.join(names)}",
        )

    current = db.get(Stage, progress.current_stage_id)
    next_stage = (
        db.query(Stage)
        .filter(
            Stage.university_id == progress.university_id,
            Stage.order > current.order,
        )
        .order_by(Stage.order)
        .first()
    )

    if next_stage:
        progress.current_stage_id = next_stage.id
        _create_student_requirements(db, progress.id, next_stage.id)
        notification_service.notify_new_stage(db, user, next_stage.name)
    else:
        progress.status = ProgressStatus.completed
        progress.current_stage_id = None

    db.commit()
    db.refresh(progress)
    return progress


def get_deadline_status(stage: Stage, student_deadline=None, started_at=None) -> dict | None:
    # student_deadline — индивидуальная дата дедлайна студента (date объект)
    today = date.today()
    if student_deadline:
        delta = (student_deadline - today).days
    elif stage and stage.deadline_days is not None:
        # Нет индивидуального дедлайна — отсчитываем deadline_days от старта прогресса.
        # Без started_at вернуть статичное число нельзя (оно «зависает» и вводит в
        # заблуждение), поэтому считаем реальный остаток от даты начала обучения.
        if started_at is None:
            return {"status": "on_track", "days_left": stage.deadline_days}
        start_date = started_at.date() if hasattr(started_at, "date") else started_at
        delta = stage.deadline_days - (today - start_date).days
    else:
        return None
    if delta < 0:
        return {"status": "overdue", "days_left": None}
    elif delta <= 7:
        return {"status": "at_risk", "days_left": delta}
    return {"status": "on_track", "days_left": delta}


def add_note(db: Session, progress: StudentProgress, stage_id: uuid.UUID, text: str) -> StudentNote:
    stage = db.get(Stage, stage_id)
    if not stage or stage.university_id != progress.university_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Этап не найден")

    note = StudentNote(student_progress_id=progress.id, stage_id=stage_id, text=text)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def update_note(db: Session, progress: StudentProgress, note_id: uuid.UUID, text: str) -> StudentNote:
    note = db.get(StudentNote, note_id)
    if not note or note.student_progress_id != progress.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заметка не найдена")
    note.text = text
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, progress: StudentProgress, note_id: uuid.UUID) -> None:
    note = db.get(StudentNote, note_id)
    if not note or note.student_progress_id != progress.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заметка не найдена")
    db.delete(note)
    db.commit()


def _create_student_requirements(db: Session, progress_id: uuid.UUID, stage_id: uuid.UUID) -> None:
    requirements = db.query(Requirement).filter(Requirement.stage_id == stage_id).all()
    for req in requirements:
        sr = StudentRequirement(student_progress_id=progress_id, requirement_id=req.id)
        db.add(sr)
