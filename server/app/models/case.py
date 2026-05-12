import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    student_name = Column(String(255), nullable=False)
    university_id = Column(UUID(as_uuid=True), ForeignKey("universities.id", ondelete="SET NULL"), nullable=True)
    country = Column(String(100), nullable=True)
    specialty = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    photo_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())

    university = relationship("University", back_populates="cases")
    photo_file = relationship("File")
