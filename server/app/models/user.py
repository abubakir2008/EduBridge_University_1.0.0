import uuid
import enum
from sqlalchemy import Column, String, Enum, Float, Integer, Text, DateTime, JSON, Date, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class UserRole(str, enum.Enum):
    student = "student"
    admin = "admin"


class AccountStatus(str, enum.Enum):
    active = "active"
    archived = "archived"
    enrolled = "enrolled"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    # Заявки часто приходят только с телефоном (WhatsApp), без email — поэтому
    # email необязателен. unique + nullable: Postgres допускает несколько NULL.
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(50), nullable=True)
    login = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.student)
    account_status = Column(Enum(AccountStatus), nullable=False, default=AccountStatus.active)

    date_of_birth = Column(Date, nullable=True)
    citizenship = Column(String(100), nullable=True)

    gpa = Column(Float, nullable=True)
    ielts_score = Column(Float, nullable=True)
    toefl_score = Column(Integer, nullable=True)
    sat_score = Column(Integer, nullable=True)
    hsk_level = Column(Integer, nullable=True)          # 1–6
    desired_specialty = Column(String(255), nullable=True)
    test_scores = Column(JSON, nullable=True)
    achievements = Column(Text, nullable=True)
    country_preference = Column(JSON, nullable=True)
    specialty_preference = Column(String(255), nullable=True)
    contact_person = Column(String(255), nullable=True)
    contact_person_phone = Column(String(50), nullable=True)
    contract_file_id = Column(UUID(as_uuid=True), nullable=True)
    language_skills = Column(JSON, nullable=True, default=list)

    max_budget_rmb = Column(Integer, nullable=True)     # макс бюджет в RMB/год
    wants_language_year = Column(String(10), nullable=True)   # yes/no/maybe
    preferred_difficulty = Column(String(20), nullable=True)  # Легко/Средний/Сложно
    program_level = Column(String(20), nullable=True)         # bachelor/master/language

    # Онбординг с AI-персонажем «Барашек»
    is_onboarded = Column(Boolean, nullable=False, default=False)  # завершил ли первичный диалог-онбординг
    onboarding_history = Column(JSON, nullable=True, default=list)  # сохранённая история чата онбординга

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    favourites = relationship("Favourite", back_populates="user", cascade="all, delete-orphan")
    student_progress = relationship("StudentProgress", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    uploaded_files = relationship("File", back_populates="uploaded_by_user")
