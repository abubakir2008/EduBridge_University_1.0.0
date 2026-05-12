from pydantic import BaseModel
from typing import Optional, List, Any
import uuid


class UniversityCreate(BaseModel):
    name: str
    country: str
    city: str
    specialties: Optional[List[str]] = None
    requirements: Optional[Any] = None
    cost: Optional[int] = None
    rating: Optional[int] = None
    description: Optional[str] = None
    logo_file_id: Optional[uuid.UUID] = None


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    specialties: Optional[List[str]] = None
    requirements: Optional[Any] = None
    cost: Optional[int] = None
    rating: Optional[int] = None
    description: Optional[str] = None
    logo_file_id: Optional[uuid.UUID] = None


class UniversityResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    city: str
    specialties: Optional[List[str]]
    requirements: Optional[Any]
    cost: Optional[int]
    rating: Optional[int]
    description: Optional[str]
    logo_file_id: Optional[uuid.UUID]

    model_config = {"from_attributes": True}


class UniversityMatchFilters(BaseModel):
    gpa: Optional[float] = None
    test_scores: Optional[Any] = None
    specialty: Optional[str] = None
    country: Optional[str] = None
    max_cost: Optional[int] = None
