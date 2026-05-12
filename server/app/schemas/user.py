from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import date, datetime
import uuid
from app.models.user import UserRole, AccountStatus


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.student
    date_of_birth: Optional[date] = None
    citizenship: Optional[str] = None
    gpa: Optional[float] = None
    test_scores: Optional[Any] = None
    achievements: Optional[str] = None
    country_preference: Optional[List[str]] = None
    specialty_preference: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    citizenship: Optional[str] = None
    gpa: Optional[float] = None
    test_scores: Optional[Any] = None
    achievements: Optional[str] = None
    country_preference: Optional[List[str]] = None
    specialty_preference: Optional[str] = None


class UserStatusUpdate(BaseModel):
    account_status: AccountStatus


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    phone: Optional[str]
    login: str
    role: UserRole
    account_status: AccountStatus
    date_of_birth: Optional[date]
    citizenship: Optional[str]
    gpa: Optional[float]
    test_scores: Optional[Any]
    achievements: Optional[str]
    country_preference: Optional[List[str]]
    specialty_preference: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
