import uuid
import enum
from sqlalchemy import Column, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ProgressStatus(str, enum.Enum):
    in_progress = "in_progress"
    completed = "completed"


class StudentProgress(Base):
    __tablename__ = "student_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    university_id = Column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    current_stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id", ondelete="SET NULL"), nullable=True)
    status = Column(Enum(ProgressStatus), nullable=False, default=ProgressStatus.in_progress)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="student_progress")
    university = relationship("University", back_populates="student_progress")
    current_stage = relationship("Stage")
    student_requirements = relationship("StudentRequirement", back_populates="progress", cascade="all, delete-orphan")
    notes = relationship("StudentNote", back_populates="progress", cascade="all, delete-orphan")
