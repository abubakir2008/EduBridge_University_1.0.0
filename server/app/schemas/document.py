import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from app.models.document import DocumentType, DocumentStatus


class DocumentFile(BaseModel):
    id: uuid.UUID
    original_name: str
    mime_type: Optional[str] = None

    model_config = {"from_attributes": True}


class DocumentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    doc_type: DocumentType
    status: DocumentStatus
    detected_type: Optional[str] = None
    ai_verdict: Optional[str] = None
    ai_reasons: Optional[list[str]] = None
    file: Optional[DocumentFile] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class DocumentUpdate(BaseModel):
    # Сменить заявленный тип документа → запускает повторную ИИ-проверку
    doc_type: DocumentType
