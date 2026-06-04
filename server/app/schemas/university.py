from pydantic import BaseModel
from typing import Optional, List, Any
import uuid


class UniversityCreate(BaseModel):
    name: str
    country: str
    city: str
    province: Optional[str] = None
    specialties: Optional[List[str]] = None
    requirements: Optional[Any] = None
    min_requirements: Optional[str] = None
    cost: Optional[int] = None
    rating: Optional[int] = None
    description: Optional[str] = None
    logo_file_id: Optional[uuid.UUID] = None
    video_url: Optional[str] = None

    programs_bachelor_chinese: Optional[List[str]] = None
    programs_masters_chinese: Optional[List[str]] = None
    programs_bachelor_english: Optional[List[str]] = None
    programs_masters_english: Optional[List[str]] = None

    has_language_year: Optional[bool] = False

    tuition_bachelor: Optional[str] = None
    tuition_masters: Optional[str] = None
    tuition_language_year: Optional[str] = None
    application_fee: Optional[str] = None

    dormitory_info: Optional[str] = None

    documents_bachelor: Optional[List[str]] = None
    documents_masters: Optional[List[str]] = None
    documents_language_year: Optional[List[str]] = None

    difficulty: Optional[str] = None
    deadline: Optional[str] = None


class UniversityUpdate(BaseModel):
    name: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    specialties: Optional[List[str]] = None
    requirements: Optional[Any] = None
    min_requirements: Optional[str] = None
    cost: Optional[int] = None
    rating: Optional[int] = None
    description: Optional[str] = None
    logo_file_id: Optional[uuid.UUID] = None
    video_url: Optional[str] = None

    programs_bachelor_chinese: Optional[List[str]] = None
    programs_masters_chinese: Optional[List[str]] = None
    programs_bachelor_english: Optional[List[str]] = None
    programs_masters_english: Optional[List[str]] = None

    has_language_year: Optional[bool] = None

    tuition_bachelor: Optional[str] = None
    tuition_masters: Optional[str] = None
    tuition_language_year: Optional[str] = None
    application_fee: Optional[str] = None

    dormitory_info: Optional[str] = None

    documents_bachelor: Optional[List[str]] = None
    documents_masters: Optional[List[str]] = None
    documents_language_year: Optional[List[str]] = None

    difficulty: Optional[str] = None
    deadline: Optional[str] = None


class UniversityResponse(BaseModel):
    id: uuid.UUID
    name: str
    country: str
    city: str
    province: Optional[str] = None
    specialties: Optional[List[str]] = None
    requirements: Optional[Any] = None
    min_requirements: Optional[str] = None
    cost: Optional[int] = None
    rating: Optional[int] = None
    description: Optional[str] = None
    logo_file_id: Optional[uuid.UUID] = None
    photo_file_ids: Optional[List[str]] = None
    video_url: Optional[str] = None
    video_file_id: Optional[uuid.UUID] = None

    programs_bachelor_chinese: Optional[List[str]] = None
    programs_masters_chinese: Optional[List[str]] = None
    programs_bachelor_english: Optional[List[str]] = None
    programs_masters_english: Optional[List[str]] = None

    has_language_year: Optional[bool] = None

    tuition_bachelor: Optional[str] = None
    tuition_masters: Optional[str] = None
    tuition_language_year: Optional[str] = None
    application_fee: Optional[str] = None

    dormitory_info: Optional[str] = None

    documents_bachelor: Optional[List[str]] = None
    documents_masters: Optional[List[str]] = None
    documents_language_year: Optional[List[str]] = None

    difficulty: Optional[str] = None
    deadline: Optional[str] = None

    model_config = {"from_attributes": True}


class UniversityMatchFilters(BaseModel):
    gpa: Optional[float] = None
    test_scores: Optional[Any] = None
    specialty: Optional[str] = None
    country: Optional[str] = None
    max_cost: Optional[int] = None
