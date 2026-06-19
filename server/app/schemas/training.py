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


class DeadlineStatus(BaseModel):
    status: str
    days_left: Optional[int]


# ── Nested response models ────────────────────────────────────────────────────

class UniversityBasic(BaseModel):
    id: uuid.UUID
    name: str
    country: Optional[str] = None
    city: Optional[str] = None

    model_config = {"from_attributes": True}


class LessonBasic(BaseModel):
    id: uuid.UUID
    title: str
    content_type: str
    content: Optional[str] = None
    file_id: Optional[uuid.UUID] = None
    order: int
    viewed: bool = False

    model_config = {"from_attributes": True}


class RequirementBasic(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    type: str
    is_required: bool = False

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_req(cls, req) -> "RequirementBasic":
        return cls(
            id=req.id,
            name=req.name,
            description=req.description,
            type=req.type,
            is_required=req.required,
        )


class StudentRequirementFull(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    is_done: bool
    file_id: Optional[uuid.UUID] = None
    requirement: RequirementBasic


class CurrentStageResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    order: int
    deadline_status: Optional[str] = None
    days_left: Optional[int] = None
    lessons: List[LessonBasic] = []
    requirements: List[StudentRequirementFull] = []


class StudentProgressResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    university_id: uuid.UUID
    current_stage_id: Optional[uuid.UUID]
    status: ProgressStatus
    started_at: datetime
    updated_at: datetime
    university: Optional[UniversityBasic] = None
    current_stage: Optional[CurrentStageResponse] = None
    all_stages: List[StageResponse] = []
    deadline_status: Optional[DeadlineStatus] = None

    model_config = {"from_attributes": True}


# ── Note models ───────────────────────────────────────────────────────────────

class StudentRequirementResponse(BaseModel):
    id: uuid.UUID
    requirement_id: uuid.UUID
    completed: bool
    completed_at: Optional[datetime]
    file_id: Optional[uuid.UUID]

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
