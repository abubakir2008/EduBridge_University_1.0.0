import uuid
from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class StudentRequirement(Base):
    __tablename__ = "student_requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_progress_id = Column(UUID(as_uuid=True), ForeignKey("student_progress.id", ondelete="CASCADE"), nullable=False)
    requirement_id = Column(UUID(as_uuid=True), ForeignKey("requirements.id", ondelete="CASCADE"), nullable=False)
    completed = Column(Boolean, nullable=False, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)

    progress = relationship("StudentProgress", back_populates="student_requirements")
    requirement = relationship("Requirement", back_populates="student_requirements")
    file = relationship("File")
