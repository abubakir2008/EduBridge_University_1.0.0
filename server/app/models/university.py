import uuid
from sqlalchemy import Column, String, Integer, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class University(Base):
    __tablename__ = "universities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    specialties = Column(JSON, nullable=True)
    requirements = Column(JSON, nullable=True)
    cost = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    logo_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)

    logo_file = relationship("File")
    stages = relationship("Stage", back_populates="university", cascade="all, delete-orphan", order_by="Stage.order")
    favourites = relationship("Favourite", back_populates="university", cascade="all, delete-orphan")
    student_progress = relationship("StudentProgress", back_populates="university")
    cases = relationship("Case", back_populates="university")
