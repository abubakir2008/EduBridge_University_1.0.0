import re
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.post import Post, PostCategory, PostStatus

try:
    from transliterate import translit
except Exception:  # pragma: no cover
    translit = None

VALID_CATEGORIES = {c.value for c in PostCategory}
VALID_STATUSES = {s.value for s in PostStatus}


def _slugify(title: str) -> str:
    text = title.strip()
    if translit:
        try:
            text = translit(text, "ru", reversed=True)
        except Exception:
            pass
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text[:80] or "post"


def _unique_slug(db: Session, base: str, exclude_id: uuid.UUID | None = None) -> str:
    slug = base
    i = 2
    while True:
        q = db.query(Post.id).filter(Post.slug == slug)
        if exclude_id:
            q = q.filter(Post.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{i}"
        i += 1


def _norm_category(cat: str | None) -> str:
    return cat if cat in VALID_CATEGORIES else PostCategory.admission.value


def list_posts(db: Session, *, category: str | None, published_only: bool,
               limit: int, offset: int) -> list[Post]:
    q = db.query(Post).filter(Post.deleted_at.is_(None))
    if published_only:
        q = q.filter(Post.status == PostStatus.published.value)
    if category and category in VALID_CATEGORIES:
        q = q.filter(Post.category == category)
    order = Post.published_at.desc().nullslast() if published_only else Post.created_at.desc()
    return q.order_by(order).limit(limit).offset(offset).all()


def get_by_slug(db: Session, slug: str, *, published_only: bool) -> Post:
    q = db.query(Post).filter(Post.slug == slug, Post.deleted_at.is_(None))
    if published_only:
        q = q.filter(Post.status == PostStatus.published.value)
    post = q.first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Статья не найдена")
    return post


def get_or_404(db: Session, post_id: uuid.UUID) -> Post:
    post = db.query(Post).filter(Post.id == post_id, Post.deleted_at.is_(None)).first()
    if not post:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Статья не найдена")
    return post


def create_post(db: Session, data: dict, author_id: uuid.UUID) -> Post:
    status_val = data.get("status") if data.get("status") in VALID_STATUSES else PostStatus.draft.value
    post = Post(
        title=data["title"],
        slug=_unique_slug(db, _slugify(data["title"])),
        category=_norm_category(data.get("category")),
        excerpt=data.get("excerpt"),
        content=data.get("content"),
        cover_file_id=data.get("cover_file_id"),
        seo_title=data.get("seo_title"),
        seo_description=data.get("seo_description"),
        status=status_val,
        author_id=author_id,
        published_at=datetime.now(timezone.utc) if status_val == PostStatus.published.value else None,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def update_post(db: Session, post: Post, data: dict) -> Post:
    if "title" in data and data["title"]:
        post.title = data["title"]
        post.slug = _unique_slug(db, _slugify(data["title"]), exclude_id=post.id)
    for field in ("excerpt", "content", "cover_file_id", "seo_title", "seo_description"):
        if field in data:
            setattr(post, field, data[field])
    if "category" in data and data["category"]:
        post.category = _norm_category(data["category"])
    if "status" in data and data["status"] in VALID_STATUSES:
        # При первой публикации фиксируем дату
        if data["status"] == PostStatus.published.value and not post.published_at:
            post.published_at = datetime.now(timezone.utc)
        post.status = data["status"]
    db.commit()
    db.refresh(post)
    return post


def delete_post(db: Session, post: Post) -> None:
    post.deleted_at = datetime.now(timezone.utc)
    db.commit()
