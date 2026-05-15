import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base


class LeadStatus(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    registered = "registered"
    rejected = "rejected"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    contact = Column(String(255), nullable=False)
    country_interest = Column(String(100), nullable=True)
    comment = Column(Text, nullable=True)
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.new)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
