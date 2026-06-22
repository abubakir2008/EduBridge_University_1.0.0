import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.stage import Stage
from app.models.student_stage_deadline import StudentStageDeadline
from app.schemas.training import (
    StartTrainingRequest, StudentProgressResponse, CompleteRequirementRequest,
    NoteCreate, NoteUpdate, NoteResponse, DeadlineStatus,
    UniversityBasic, CurrentStageResponse, StudentRequirementFull,
    RequirementBasic, LessonBasic,
)
from app.schemas.stage import StageResponse
from app.services import training_service

router = APIRouter(prefix="/training", tags=["training"])


def _check_owner_or_admin(user_id: uuid.UUID, current_user: User) -> None:
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")


def _build_progress_response(db: Session, progress) -> StudentProgressResponse:
    """Build a full StudentProgressResponse with nested university, stages, requirements."""
    # University
    uni = UniversityBasic.model_validate(progress.university) if progress.university else None

    # All stages for this university
    all_stages_orm = (
        db.query(Stage)
        .filter(Stage.university_id == progress.university_id)
        .order_by(Stage.order)
        .all()
    )
    all_stages = [StageResponse.model_validate(s) for s in all_stages_orm]

    # Current stage with lessons + student requirements
    current_stage_resp = None
    deadline_status = None

    if progress.current_stage:
        stage = progress.current_stage

        # Deadline
        student_dl = db.query(StudentStageDeadline).filter(
            StudentStageDeadline.student_progress_id == progress.id,
            StudentStageDeadline.stage_id == progress.current_stage_id,
        ).first()
        ds = training_service.get_deadline_status(
            stage,
            student_deadline=student_dl.deadline if student_dl else None,
            started_at=progress.started_at,
        )
        dl_status_str = ds["status"] if ds else None
        days_left = ds.get("days_left") if ds else None
        if ds:
            deadline_status = DeadlineStatus(**ds)

        # Lessons (+ отметка просмотра студентом)
        from app.models.lesson_view import LessonView
        sorted_lessons = sorted(stage.lessons, key=lambda x: x.order)
        viewed_ids = {
            row[0] for row in db.query(LessonView.lesson_id).filter(
                LessonView.user_id == progress.user_id,
                LessonView.lesson_id.in_([l.id for l in sorted_lessons]) if sorted_lessons else False,
            ).all()
        } if sorted_lessons else set()
        lessons = [
            LessonBasic(
                id=l.id, title=l.title, content_type=l.content_type,
                content=l.content, file_id=l.file_id, order=l.order,
                viewed=l.id in viewed_ids,
            )
            for l in sorted_lessons
        ]

        # Student requirements for current stage (only current stage's reqs)
        stage_req_ids = {r.id for r in stage.requirements}
        student_reqs = []
        for sr in progress.student_requirements:
            if sr.requirement_id in stage_req_ids:
                student_reqs.append(StudentRequirementFull(
                    id=sr.id,
                    requirement_id=sr.requirement_id,
                    is_done=sr.completed,
                    file_id=sr.file_id,
                    requirement=RequirementBasic.from_orm_req(sr.requirement),
                ))

        current_stage_resp = CurrentStageResponse(
            id=stage.id,
            name=stage.name,
            description=stage.description,
            order=stage.order,
            deadline_status=dl_status_str,
            days_left=days_left,
            lessons=lessons,
            requirements=student_reqs,
        )

    return StudentProgressResponse(
        id=progress.id,
        user_id=progress.user_id,
        university_id=progress.university_id,
        current_stage_id=progress.current_stage_id,
        status=progress.status,
        started_at=progress.started_at,
        updated_at=progress.updated_at,
        university=uni,
        current_stage=current_stage_resp,
        all_stages=all_stages,
        deadline_status=deadline_status,
    )


@router.get("/{user_id}", response_model=StudentProgressResponse)
def get_progress(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_owner_or_admin(user_id, current_user)
    progress = training_service.get_progress_or_404(db, user_id)
    return _build_progress_response(db, progress)


@router.post("/{user_id}/start", response_model=StudentProgressResponse, status_code=201)
def start_training(
    user_id: uuid.UUID,
    body: StartTrainingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_owner_or_admin(user_id, current_user)
    from app.services.user_service import get_user_or_404
    user = get_user_or_404(db, user_id)
    progress = training_service.start_training(db, user, body.university_id)
    return _build_progress_response(db, progress)


@router.delete("/{user_id}/cancel", status_code=204)
def cancel_training(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_owner_or_admin(user_id, current_user)
    from app.services.user_service import get_user_or_404
    user = get_user_or_404(db, user_id)
    training_service.cancel_training(db, user)


@router.patch("/{user_id}/requirements/{requirement_id}", response_model=dict)
def complete_requirement(
    user_id: uuid.UUID,
    requirement_id: uuid.UUID,
    body: CompleteRequirementRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    training_service.complete_requirement(db, current_user, progress, requirement_id, body.file_id)
    return {"message": "Требование выполнено"}


@router.delete("/{user_id}/requirements/{requirement_id}", status_code=204)
def clear_requirement(
    user_id: uuid.UUID,
    requirement_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Убрать документ / снять отметку выполнения требования (для замены/удаления)."""
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    training_service.clear_requirement(db, progress, requirement_id)


@router.post("/{user_id}/stage/next", response_model=StudentProgressResponse)
def next_stage(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    from app.services.user_service import get_user_or_404
    user = get_user_or_404(db, user_id)
    progress = training_service.advance_stage(db, user, progress)
    return _build_progress_response(db, progress)


@router.get("/{user_id}/notes", response_model=list[NoteResponse])
def get_notes(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_owner_or_admin(user_id, current_user)
    progress = training_service.get_progress_or_404(db, user_id)
    return progress.notes


@router.post("/{user_id}/stage/{stage_id}/notes", response_model=NoteResponse, status_code=201)
def add_note(
    user_id: uuid.UUID,
    stage_id: uuid.UUID,
    body: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    return training_service.add_note(db, progress, stage_id, body.text)


@router.patch("/{user_id}/notes/{note_id}", response_model=NoteResponse)
def update_note(
    user_id: uuid.UUID,
    note_id: uuid.UUID,
    body: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    return training_service.update_note(db, progress, note_id, body.text)


@router.delete("/{user_id}/notes/{note_id}", status_code=204)
def delete_note(
    user_id: uuid.UUID,
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    progress = training_service.get_progress_or_404(db, user_id)
    training_service.delete_note(db, progress, note_id)


# ── Индивидуальные дедлайны студента по этапам ───────────────────────────────

class DeadlineSet(BaseModel):
    deadline: date


@router.get("/{user_id}/stage-deadlines")
def get_stage_deadlines(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    progress = training_service.get_progress_or_404(db, user_id)
    rows = db.query(StudentStageDeadline).filter(
        StudentStageDeadline.student_progress_id == progress.id
    ).all()
    return {str(r.stage_id): str(r.deadline) for r in rows}


@router.put("/{user_id}/stage-deadlines/{stage_id}", status_code=200)
def set_stage_deadline(
    user_id: uuid.UUID,
    stage_id: uuid.UUID,
    body: DeadlineSet,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    progress = training_service.get_progress_or_404(db, user_id)
    row = db.query(StudentStageDeadline).filter(
        StudentStageDeadline.student_progress_id == progress.id,
        StudentStageDeadline.stage_id == stage_id,
    ).first()
    if row:
        row.deadline = body.deadline
    else:
        row = StudentStageDeadline(
            student_progress_id=progress.id,
            stage_id=stage_id,
            deadline=body.deadline,
        )
        db.add(row)
    db.commit()
    return {"stage_id": str(stage_id), "deadline": str(body.deadline)}


@router.delete("/{user_id}/stage-deadlines/{stage_id}", status_code=204)
def delete_stage_deadline(
    user_id: uuid.UUID,
    stage_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    progress = training_service.get_progress_or_404(db, user_id)
    db.query(StudentStageDeadline).filter(
        StudentStageDeadline.student_progress_id == progress.id,
        StudentStageDeadline.stage_id == stage_id,
    ).delete()
    db.commit()
