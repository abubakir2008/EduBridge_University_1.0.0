from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class PostCreate(BaseModel):
    title: str
    category: str
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_file_id: Optional[uuid.UUID] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "draft"          # draft | published


class PostUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    cover_file_id: Optional[uuid.UUID] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: Optional[str] = None


class PostListItem(BaseModel):
    """Лёгкая версия для индекса (без тела статьи)."""
    id: uuid.UUID
    title: str
    slug: str
    category: str
    excerpt: Optional[str] = None
    cover_file_id: Optional[uuid.UUID] = None
    status: str
    published_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PostResponse(PostListItem):
    content: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


# ── Рубрики ────────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    icon: Optional[str] = None
    sort_order: int = 0

    model_config = {"from_attributes": True}
