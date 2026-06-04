import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File as FastAPIFile, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.file import File
from app.models.admin_note import AdminNote
from app.models.activity_log import ActivityLog
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserStatusUpdate
from app.schemas.auth import CredentialsResponse
from app.services import user_service
from app.services import notification_service
from app.services.file_service import upload_file, stream_file

router = APIRouter(prefix="/users", tags=["users"])


class PaginatedUsers(BaseModel):
    items: list[UserResponse]
    total: int
    page: int
    pages: int


@router.get("", response_model=PaginatedUsers)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    q = db.query(User).filter(User.deleted_at.is_(None))
    if search:
        term = f"%{search}%"
        q = q.filter(
            User.full_name.ilike(term) | User.login.ilike(term) | User.email.ilike(term)
        )
    total = q.count()
    items = q.order_by(User.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    return PaginatedUsers(items=items, total=total, page=page, pages=max(1, -(-total // per_page)))


@router.post("", response_model=CredentialsResponse, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user, plain_password = user_service.create_user(db, body)
    notification_service.notify_account_created(db, user, user.login, plain_password)
    return CredentialsResponse(login=user.login, password=plain_password)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    return user_service.get_user_or_404(db, user_id)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    user = user_service.get_user_or_404(db, user_id)
    return user_service.update_user(db, user, body)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = user_service.get_user_or_404(db, user_id)
    user_service.delete_user(db, user)


# ── Admin notes ─────────────────────────────────────────────────────────────

class NoteCreate(BaseModel):
    text: str


class NoteResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    admin_id: Optional[uuid.UUID]
    text: str
    created_at: str

    model_config = {"from_attributes": True}


@router.get("/{user_id}/notes", response_model=list[NoteResponse])
def list_notes(user_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    user_service.get_user_or_404(db, user_id)
    notes = db.query(AdminNote).filter(AdminNote.user_id == user_id).order_by(AdminNote.created_at.desc()).all()
    return [NoteResponse(
        id=n.id, user_id=n.user_id, admin_id=n.admin_id,
        text=n.text, created_at=n.created_at.isoformat(),
    ) for n in notes]


@router.post("/{user_id}/notes", response_model=NoteResponse, status_code=201)
def create_note(
    user_id: uuid.UUID,
    body: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user_service.get_user_or_404(db, user_id)
    note = AdminNote(user_id=user_id, admin_id=current_user.id, text=body.text.strip())
    db.add(note)
    db.commit()
    db.refresh(note)
    return NoteResponse(
        id=note.id, user_id=note.user_id, admin_id=note.admin_id,
        text=note.text, created_at=note.created_at.isoformat(),
    )


@router.delete("/{user_id}/notes/{note_id}", status_code=204)
def delete_note(
    user_id: uuid.UUID,
    note_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    note = db.query(AdminNote).filter(AdminNote.id == note_id, AdminNote.user_id == user_id).first()
    if not note:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Заметка не найдена")
    db.delete(note)
    db.commit()


# ── Status change with activity log ─────────────────────────────────────────

@router.patch("/{user_id}/status", response_model=UserResponse)
def change_status(
    user_id: uuid.UUID,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = user_service.get_user_or_404(db, user_id)
    old_status = user.account_status
    result = user_service.change_status(db, user, body.account_status)
    log = ActivityLog(
        admin_id=current_user.id,
        entity_type="user",
        entity_id=user_id,
        action="status_changed",
        detail=f"{old_status} → {body.account_status}",
    )
    db.add(log)
    db.commit()
    return result


@router.post("/{user_id}/contract", status_code=204)
def upload_contract(
    user_id: uuid.UUID,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    allowed_types = {
        "application/pdf", "image/jpeg", "image/png",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Разрешены: PDF, JPG, PNG, DOC, DOCX",
        )
    user = user_service.get_user_or_404(db, user_id)
    record = upload_file(db, file, "documents", current_user.id)
    user.contract_file_id = record.id
    db.commit()


@router.get("/{user_id}/contract")
def stream_contract(
    user_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Admin sees any contract; a student may only see their own.
    if current_user.role != UserRole.admin and current_user.id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    user = user_service.get_user_or_404(db, user_id)
    if not user.contract_file_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Контракт не загружен")
    record = db.get(File, user.contract_file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(
        record,
        request.headers.get("range"),
        cache_control="private, no-store",
        inline_filename=True,
    )
