import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserResponse, UserStatusUpdate
from app.schemas.auth import CredentialsResponse
from app.services import user_service
from app.services import notification_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()


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


@router.patch("/{user_id}/status", response_model=UserResponse)
def change_status(
    user_id: uuid.UUID,
    body: UserStatusUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    user = user_service.get_user_or_404(db, user_id)
    return user_service.change_status(db, user, body.account_status)


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = user_service.get_user_or_404(db, user_id)
    user_service.delete_user(db, user)
