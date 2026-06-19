import uuid
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_token, ACCESS_COOKIE
from app.models.user import User, UserRole, AccountStatus


def _extract_token(request: Request) -> str | None:
    """Read the access token from the Authorization header or the httpOnly cookie.

    Browser media tags (<img>/<video>/<iframe>) can't set headers, so cookie auth
    is what keeps file streaming protected while hiding the storage backend."""
    auth = request.headers.get("Authorization", "")
    perfix = "bearer "
    if auth.lower().startswith(perfix.lower()):
        token = auth[len(perfix):].strip()
        if token:
            return token
    return request.cookies.get(ACCESS_COOKIE)


def _get_current_user(
    request: Request,
    db: Session = Depends(get_db),
    ) -> User:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "no token provided")

    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token is not valid")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError, TypeError):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token is not valid")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "token is not valid")
    if user.account_status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is not active")
    return user


def get_current_user(user: User = Depends(_get_current_user)) -> User:
    return user


def require_admin(user: User = Depends(_get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
    return user


def require_owner_or_admin(
    target_user_id: uuid.UUID,
    current_user: User = Depends(_get_current_user),
) -> User:
    if current_user.role == UserRole.admin:
        return current_user
    if current_user.id != target_user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Access denied")
    return current_user
