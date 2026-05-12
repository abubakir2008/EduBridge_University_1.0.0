from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class CaseCreate(BaseModel):
    title: str
    student_name: str
    university_id: Optional[uuid.UUID] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    description: Optional[str] = None
    photo_file_id: Optional[uuid.UUID] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    student_name: Optional[str] = None
    university_id: Optional[uuid.UUID] = None
    country: Optional[str] = None
    specialty: Optional[str] = None
    description: Optional[str] = None
    photo_file_id: Optional[uuid.UUID] = None


class CaseResponse(BaseModel):
    id: uuid.UUID
    title: str
    student_name: str
    university_id: Optional[uuid.UUID]
    country: Optional[str]
    specialty: Optional[str]
    description: Optional[str]
    photo_file_id: Optional[uuid.UUID]
    published_at: datetime

    model_config = {"from_attributes": True}
