import uuid
import enum
from sqlalchemy import Column, String, Text, Boolean, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class RequirementType(str, enum.Enum):
    checkbox = "checkbox"
    file_upload = "file_upload"


class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(Enum(RequirementType), nullable=False, default=RequirementType.checkbox)
    required = Column(Boolean, nullable=False, default=True)

    stage = relationship("Stage", back_populates="requirements")
    student_requirements = relationship("StudentRequirement", back_populates="requirement")
