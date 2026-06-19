import uuid
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base


class Category(Base):
    """Рубрика блога. Полностью управляется через админку (CRUD).

    Post.category хранит slug рубрики (мягкая связь по строке).
    """
    __tablename__ = "post_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(String(300), nullable=True)
    icon = Column(String(40), nullable=True)   # ключ lucide-иконки (без эмодзи)
    sort_order = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
