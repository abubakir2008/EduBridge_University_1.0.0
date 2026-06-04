import uuid
from sqlalchemy import Column, String, Integer, Text, JSON, Boolean, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    province = Column(String(100), nullable=True)
    specialties = Column(JSON, nullable=True)
    requirements = Column(JSON, nullable=True)
    min_requirements = Column(Text, nullable=True)
    cost = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

    # Programs
    programs_bachelor_chinese = Column(JSON, nullable=True)
    programs_masters_chinese = Column(JSON, nullable=True)
    programs_bachelor_english = Column(JSON, nullable=True)
    programs_masters_english = Column(JSON, nullable=True)

    # Language year
    has_language_year = Column(Boolean, nullable=True, default=False)

    # Tuition
    tuition_bachelor = Column(String(300), nullable=True)
    tuition_masters = Column(String(300), nullable=True)
    tuition_language_year = Column(String(300), nullable=True)
    application_fee = Column(String(200), nullable=True)

    # Dormitory
    dormitory_info = Column(Text, nullable=True)

    # Required documents
    documents_bachelor = Column(JSON, nullable=True)
    documents_masters = Column(JSON, nullable=True)
    documents_language_year = Column(JSON, nullable=True)

    # Admission info
    difficulty = Column(String(50), nullable=True)
    deadline = Column(Text, nullable=True)

    logo_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    photo_file_ids = Column(JSON, nullable=True, default=list)
    video_url = Column(String(500), nullable=True)
    video_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    logo_file = relationship("File", foreign_keys=[logo_file_id])
    stages = relationship("Stage", back_populates="university", cascade="all, delete-orphan", order_by="Stage.order")
    favourites = relationship("Favourite", back_populates="university", cascade="all, delete-orphan")
    student_progress = relationship("StudentProgress", back_populates="university")
    cases = relationship("Case", back_populates="university")
