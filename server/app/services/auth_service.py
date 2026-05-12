import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import verify_password, hash_password, create_access_token
from app.core.config import settings
from app.core.credentials import generate_password
from app.models.user import User, AccountStatus
from app.models.refresh_token import RefreshToken


def authenticate(db: Session, login: str, password: str) -> User:
    user = db.query(User).filter(User.login == login).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный логин или пароль")
    if user.account_status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Аккаунт неактивен")
    return user


def create_tokens(db: Session, user: User) -> dict:
    access_token = create_access_token(str(user.id), user.role.value)

    raw_refresh = str(uuid.uuid4())
    expires = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_EXPIRE_DAYS)
    rt = RefreshToken(user_id=user.id, token=raw_refresh, expires_at=expires)
    db.add(rt)
    db.commit()

    return {"access_token": access_token, "refresh_token": raw_refresh}


def refresh_tokens(db: Session, raw_refresh: str) -> dict:
    rt = db.query(RefreshToken).filter(
        RefreshToken.token == raw_refresh,
        RefreshToken.revoked == False,  # noqa: E712
    ).first()
    if not rt:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token недействителен")
    if rt.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token истёк")

    user = db.get(User, rt.user_id)
    if not user or user.account_status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Аккаунт недоступен")

    rt.revoked = True
    db.commit()

    return create_tokens(db, user)


def logout(db: Session, raw_refresh: str) -> None:
    rt = db.query(RefreshToken).filter(RefreshToken.token == raw_refresh).first()
    if rt:
        rt.revoked = True
        db.commit()


def reset_password(db: Session, user: User) -> str:
    new_password = generate_password()
    user.password_hash = hash_password(new_password)
    db.commit()
    return new_password
