import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.security import hash_password
from app.core.credentials import generate_login, generate_password
from app.models.user import User, UserRole, AccountStatus
from app.schemas.user import UserCreate, UserUpdate


def get_user_or_404(db: Session, user_id: uuid.UUID) -> User:
    user = db.get(User, user_id)
    if not user or user.deleted_at is not None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    return user


def create_user(db: Session, data: UserCreate) -> tuple[User, str]:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Email уже используется")

    phone = data.phone or "0000"
    login = _unique_login(db, data.full_name, phone)
    plain_password = generate_password()

    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        login=login,
        password_hash=hash_password(plain_password),
        role=data.role,
        date_of_birth=data.date_of_birth,
        citizenship=data.citizenship,
        gpa=data.gpa,
        test_scores=data.test_scores,
        achievements=data.achievements,
        country_preference=data.country_preference,
        specialty_preference=data.specialty_preference,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, plain_password


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


def change_status(db: Session, user: User, new_status: AccountStatus) -> User:
    user.account_status = new_status
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    user.deleted_at = datetime.now(timezone.utc)
    db.commit()


def _unique_login(db: Session, full_name: str, phone: str) -> str:
    for _ in range(10):
        login = generate_login(full_name, phone)
        if not db.query(User).filter(User.login == login).first():
            return login
    raise HTTPException(500, "Не удалось сгенерировать уникальный логин")
