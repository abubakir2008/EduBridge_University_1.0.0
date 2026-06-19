import uuid
import enum
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.base import Base


class PostCategory(str, enum.Enum):
    relocation = "relocation"   # Переезд и виза
    admission = "admission"     # Поступление и документы
    languages = "languages"     # Языки и тесты
    grants = "grants"           # Гранты, страны и жизнь


class PostStatus(str, enum.Enum):
    draft = "draft"
    published = "published"


class Post(Base):
    __tablename__ = "posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    slug = Column(String(300), unique=True, nullable=False, index=True)
    category = Column(String(40), nullable=False, default=PostCategory.admission.value)

    excerpt = Column(String(500), nullable=True)   # короткое описание для карточки/мета
    content = Column(Text, nullable=True)          # HTML тела статьи (rich text)
    cover_file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="SET NULL"), nullable=True)

    # SEO/GEO
    seo_title = Column(String(300), nullable=True)
    seo_description = Column(String(500), nullable=True)

    status = Column(String(20), nullable=False, default=PostStatus.draft.value, index=True)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    deleted_at = Column(DateTime(timezone=True), nullable=True)
