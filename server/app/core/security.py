from datetime import datetime, timedelta, timezone
from typing import Optional
import bcrypt
from fastapi import Response
from jose import jwt, JWTError
from app.core.config import settings

ALGORITHM = "HS256"

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: str, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "role": role, "exp": expire, "type": "access"},
        settings.JWT_SECRET,
        algorithm=ALGORITHM,
    )


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    except JWTError:
        return None


def _cookie_kwargs() -> dict:
    kwargs = {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": settings.COOKIE_SAMESITE,
        "path": "/",
    }
    if settings.COOKIE_DOMAIN:
        kwargs["domain"] = settings.COOKIE_DOMAIN
    return kwargs


def set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Store both tokens as httpOnly cookies so JS (and any XSS) can never read them.

    The browser still sends them automatically on same-origin requests — including
    <img>/<video>/<iframe> tags — which is how file streaming stays authenticated.
    """
    # Cookie lifetime tracks the refresh window; real access-token validity is the JWT exp.
    max_age = settings.JWT_REFRESH_EXPIRE_DAYS * 24 * 3600
    kwargs = _cookie_kwargs()
    response.set_cookie(ACCESS_COOKIE, access_token, max_age=max_age, **kwargs)
    response.set_cookie(REFRESH_COOKIE, refresh_token, max_age=max_age, **kwargs)


def clear_auth_cookies(response: Response) -> None:
    kwargs = _cookie_kwargs()
    kwargs.pop("httponly", None)
    response.delete_cookie(ACCESS_COOKIE, path="/", domain=kwargs.get("domain"))
    response.delete_cookie(REFRESH_COOKIE, path="/", domain=kwargs.get("domain"))
