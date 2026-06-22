from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import date, datetime
import uuid
from app.models.user import UserRole, AccountStatus


class LanguageSkill(BaseModel):
    language: str
    level: str  # A1 A2 B1 B2 C1 C2 Native


class UserCreate(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: UserRole = UserRole.student
    date_of_birth: Optional[date] = None
    citizenship: Optional[str] = None
    gpa: Optional[float] = None
    ielts_score: Optional[float] = None
    sat_score: Optional[int] = None
    desired_specialty: Optional[str] = None
    test_scores: Optional[Any] = None
    achievements: Optional[str] = None
    country_preference: Optional[List[str]] = None
    specialty_preference: Optional[str] = None
    contact_person: Optional[str] = None
    contact_person_phone: Optional[str] = None
    language_skills: Optional[List[LanguageSkill]] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    citizenship: Optional[str] = None
    gpa: Optional[float] = None
    ielts_score: Optional[float] = None
    toefl_score: Optional[int] = None
    sat_score: Optional[int] = None
    hsk_level: Optional[int] = None
    desired_specialty: Optional[str] = None
    test_scores: Optional[Any] = None
    achievements: Optional[str] = None
    country_preference: Optional[List[str]] = None
    specialty_preference: Optional[str] = None
    contact_person: Optional[str] = None
    contact_person_phone: Optional[str] = None
    language_skills: Optional[List[LanguageSkill]] = None
    max_budget_rmb: Optional[int] = None
    wants_language_year: Optional[str] = None
    preferred_difficulty: Optional[str] = None
    program_level: Optional[str] = None
    is_onboarded: Optional[bool] = None


class UserStatusUpdate(BaseModel):
    account_status: AccountStatus


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    login: str
    role: UserRole
    account_status: AccountStatus
    date_of_birth: Optional[date]
    citizenship: Optional[str]
    gpa: Optional[float]
    ielts_score: Optional[float]
    toefl_score: Optional[int]
    sat_score: Optional[int]
    hsk_level: Optional[int]
    desired_specialty: Optional[str]
    test_scores: Optional[Any]
    achievements: Optional[str]
    country_preference: Optional[List[str]]
    specialty_preference: Optional[str]
    contact_person: Optional[str]
    contact_person_phone: Optional[str]
    contract_file_id: Optional[uuid.UUID]
    language_skills: Optional[List[Any]]
    max_budget_rmb: Optional[int]
    wants_language_year: Optional[str]
    preferred_difficulty: Optional[str]
    program_level: Optional[str]
    is_onboarded: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
