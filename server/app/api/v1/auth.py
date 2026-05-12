import uuid
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.schemas.auth import LoginRequest, TokenResponse, RefreshRequest, CredentialsResponse
from app.services import notification_service
from app.models.user import User
from app.services.user_service import get_user_or_404
from app.services import auth_service
from app.core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = auth_service.authenticate(db, body.login, body.password)
    tokens = auth_service.create_tokens(db, user)
    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")
def refresh(request: Request, body: RefreshRequest, db: Session = Depends(get_db)):
    tokens = auth_service.refresh_tokens(db, body.refresh_token)
    return TokenResponse(**tokens)


@router.post("/logout", status_code=204)
def logout(body: RefreshRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    auth_service.logout(db, body.refresh_token)


@router.post("/reset-password/{user_id}", response_model=CredentialsResponse)
def reset_password(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = get_user_or_404(db, user_id)
    new_password = auth_service.reset_password(db, user)
    notification_service.notify_password_reset(db, user, new_password)
    return CredentialsResponse(login=user.login, password=new_password)
