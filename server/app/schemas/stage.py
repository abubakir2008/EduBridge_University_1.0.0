from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from app.models.requirement import RequirementType


class RequirementCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: RequirementType = RequirementType.checkbox
    is_required: bool = True


class RequirementUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[RequirementType] = None
    is_required: Optional[bool] = None


class RequirementResponse(BaseModel):
    id: uuid.UUID
    stage_id: uuid.UUID
    name: str
    description: Optional[str]
    type: RequirementType
    is_required: bool = Field(False, alias='required')

    model_config = {"from_attributes": True, "populate_by_name": True}


class StageCreate(BaseModel):
    name: str
    order: int = 1
    description: Optional[str] = None
    deadline_days: Optional[int] = None
    requirements: Optional[List[RequirementCreate]] = None


class StageUpdate(BaseModel):
    name: Optional[str] = None
    order: Optional[int] = None
    description: Optional[str] = None
    deadline_days: Optional[int] = None


class StageResponse(BaseModel):
    id: uuid.UUID
    university_id: uuid.UUID
    name: str
    order: int
    description: Optional[str]
    deadline_days: Optional[int]
    created_at: datetime
    requirements: List[RequirementResponse] = []

    model_config = {"from_attributes": True}
