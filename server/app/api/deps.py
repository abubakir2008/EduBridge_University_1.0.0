import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token
from app.models.user import User, UserRole, AccountStatus

bearer = HTTPBearer()


def _get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Токен недействителен")

    user = db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Пользователь не найден")
    if user.account_status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Аккаунт заблокирован")
    return user


def get_current_user(user: User = Depends(_get_current_user)) -> User:
    return user


def require_admin(user: User = Depends(_get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    return user


def require_owner_or_admin(
    target_user_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
) -> User:
    if current_user.role == UserRole.admin:
        return current_user
    if current_user.id != target_user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    return current_user
