import uuid
from sqlalchemy import Column, Date, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from app.db.base import Base


class StudentStageDeadline(Base):
    __tablename__ = "student_stage_deadlines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_progress_id = Column(UUID(as_uuid=True), ForeignKey("student_progress.id", ondelete="CASCADE"), nullable=False)
    stage_id = Column(UUID(as_uuid=True), ForeignKey("stages.id", ondelete="CASCADE"), nullable=False)
    deadline = Column(Date, nullable=False)

    __table_args__ = (
        UniqueConstraint("student_progress_id", "stage_id", name="uq_progress_stage_deadline"),
    )
