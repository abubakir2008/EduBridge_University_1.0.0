import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.schemas.training import (
    StartTrainingRequest, StudentProgressResponse, CompleteRequirementRequest,
    NoteCreate, NoteUpdate, NoteResponse, DeadlineStatus,
)
from app.services import training_service

router = APIRouter(prefix="/training", tags=["training"])


def _check_owner_or_admin(user_id: uuid.UUID, current_user: User) -> None:
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")


@router.get("/{user_id}", response_model=StudentProgressResponse)
def get_progress(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_owner_or_admin(user_id, current_user)
    progress = training_service.get_progress_or_404(db, user_id)
    response = StudentProgressResponse.model_validate(progress)
    if progress.current_stage:
        ds = training_service.get_deadline_status(progress.current_stage)
        if ds:
            response.deadline_status = DeadlineStatus(**ds)
    return response


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
    return StudentProgressResponse.model_validate(progress)


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
    return StudentProgressResponse.model_validate(progress)


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
