from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
from app.models.student_progress import ProgressStatus
from app.schemas.stage import StageResponse


class StartTrainingRequest(BaseModel):
    university_id: uuid.UUID


class CompleteRequirementRequest(BaseModel):
    file_id: Optional[uuid.UUID] = None


class StudentRequirementResponse(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    completed: bool
    completed_at: Optional[datetime]
    file_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


class DeadlineStatus(BaseModel):
    status: str
    days_left: Optional[int]


class StudentProgressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    university_id: uuid.UUID
    current_stage_id: Optional[uuid.UUID]
    status: ProgressStatus
    started_at: datetime
    updated_at: datetime
    student_requirements: List[StudentRequirementResponse] = []
    deadline_status: Optional[DeadlineStatus] = None

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    text: str


class NoteUpdate(BaseModel):
    text: str


class NoteResponse(BaseModel):
    id: uuid.UUID
    student_progress_id: uuid.UUID
    stage_id: uuid.UUID
    text: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
