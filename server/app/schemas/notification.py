from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.models.notification import NotificationChannel


class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: str
    message: str
    channel: NotificationChannel
    is_read: bool
    sent_at: datetime

    model_config = {"from_attributes": True}


class SendNotificationRequest(BaseModel):
    user_id: uuid.UUID
    message: str
    type: str = "manual"
    channel: NotificationChannel = NotificationChannel.email
