import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.auth import LoginRequest, LoginResponse, CredentialsResponse
from app.services import notification_service
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.services.user_service import get_user_or_404
from app.services import auth_service
from app.core.security import set_auth_cookies, clear_auth_cookies, REFRESH_COOKIE
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, response: Response, body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, body.login, body.password)
    tokens = auth_service.create_tokens(db, user)
    set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
    return LoginResponse(role=user.role.value)


@router.post("/refresh", response_model=LoginResponse)
@limiter.limit("10/minute")
def refresh(request: Request, response: Response, db: Session = Depends(get_db)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE)
    if raw_refresh:
        try:
            tokens = auth_service.refresh_tokens(db, raw_refresh)
            set_auth_cookies(response, tokens["access_token"], tokens["refresh_token"])
            return LoginResponse(role=tokens.get("role", ""))
        except HTTPException:
            pass

    # Сессия мертва (нет/протух/отозван refresh) — чистим куки, чтобы фронт+middleware
    # не зациклились на редиректах /dashboard ⇄ /login из-за «протухшей» access-cookie.
    fail = JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={"detail": "Сессия истекла, войдите снова"},
    )
    clear_auth_cookies(fail)
    return fail


@router.post("/logout", status_code=204)
def logout(request: Request, response: Response, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    raw_refresh = request.cookies.get(REFRESH_COOKIE)
    if raw_refresh:
        auth_service.logout(db, raw_refresh)
    clear_auth_cookies(response)


@router.post("/reset-password/{user_id}", response_model=CredentialsResponse)
@limiter.limit("3/minute")
def reset_password(
    request: Request,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = get_user_or_404(db, user_id)
    new_password = auth_service.reset_password(db, user)
    notification_service.notify_password_reset(db, user, new_password)
    log = ActivityLog(
        admin_id=current_user.id,
        entity_type="user",
        entity_id=user_id,
        action="password_reset",
        detail=f"Пароль сброшен для {user.full_name}",
    )
    db.add(log)
    db.commit()
    return CredentialsResponse(login=user.login, password=new_password)
