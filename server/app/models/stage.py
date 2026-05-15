import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Stage(Base):
    __tablename__ = "stages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    university_id = Column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    order = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    deadline_days = Column(Integer, nullable=True)  # кол-во дней на выполнение этапа
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    university = relationship("University", back_populates="stages")
    requirements = relationship("Requirement", back_populates="stage", cascade="all, delete-orphan")
    lessons = relationship("Lesson", back_populates="stage")
    student_notes = relationship("StudentNote", back_populates="stage")
