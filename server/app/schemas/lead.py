from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.models.lead import LeadStatus


class LeadCreate(BaseModel):
    name: str
    contact: str
    country_interest: Optional[str] = None
    comment: Optional[str] = None


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class LeadResponse(BaseModel):
    id: uuid.UUID
    name: str
    contact: str
    country_interest: Optional[str]
    comment: Optional[str]
    status: LeadStatus
    created_at: datetime

    model_config = {"from_attributes": True}
