import uuid
import enum
from sqlalchemy import Column, String, Text, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class ContentType(str, enum.Enum):
    text = "text"
    video = "video"
    document = "document"


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content_type = Column(Enum(ContentType), nullable=False, default=ContentType.text)
    body = Column(Text, nullable=True)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id", ondelete="SET NULL"), nullable=True)
    order = Column(Integer, nullable=False, default=1)

    file = relationship("File")
    stage = relationship("Stage", back_populates="lessons")
