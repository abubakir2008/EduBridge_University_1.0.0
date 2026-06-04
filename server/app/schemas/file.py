from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class FileResponse(BaseModel):
    id: uuid.UUID
    bucket: str
    object_key: str
    original_name: str
    mime_type: Optional[str]
    uploaded_by: Optional[uuid.UUID]
    created_at: datetime

    model_config = {"from_attributes": True}
