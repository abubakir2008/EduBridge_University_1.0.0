from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
import uuid
from app.models.requirement import RequirementType


class RequirementCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: RequirementType = RequirementType.checkbox
    required: bool = True


class RequirementUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[RequirementType] = None
    required: Optional[bool] = None


class RequirementResponse(BaseModel):
    id: uuid.UUID
    stage_id: uuid.UUID
    name: str
    description: Optional[str]
    type: RequirementType
    required: bool

    model_config = {"from_attributes": True}


class StageCreate(BaseModel):
    name: str
    order: int = 1
    description: Optional[str] = None
    deadline: Optional[date] = None
    requirements: Optional[List[RequirementCreate]] = None


class StageUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None
    description: Optional[str] = None
    deadline: Optional[date] = None


class StageResponse(BaseModel):
    id: uuid.UUID
    university_id: uuid.UUID
    name: str
    order: int
    description: Optional[str]
    deadline: Optional[date]
    created_at: datetime
    requirements: List[RequirementResponse] = []

    model_config = {"from_attributes": True}
