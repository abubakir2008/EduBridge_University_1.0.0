from pydantic import BaseModel
from typing import Optional
import uuid
from app.models.lesson import ContentType


class LessonCreate(BaseModel):
    title: str
    content_type: ContentType = ContentType.text
    content: Optional[str] = None
    file_id: Optional[uuid.UUID] = None
    stage_id: Optional[uuid.UUID] = None
    order: int = 1


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[ContentType] = None
    content: Optional[str] = None
    file_id: Optional[uuid.UUID] = None
    stage_id: Optional[uuid.UUID] = None
    order: Optional[int] = None


class LessonResponse(BaseModel):
    id: uuid.UUID
    title: str
    content_type: ContentType
    content: Optional[str]
    file_id: Optional[uuid.UUID]
    stage_id: Optional[uuid.UUID]
    order: int

    model_config = {"from_attributes": True}
