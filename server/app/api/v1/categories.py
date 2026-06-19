import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin
from app.models.user import User
from app.models.post_category import Category
from app.schemas.post import CategoryCreate, CategoryUpdate, CategoryResponse
from app.services.post_service import _slugify

router = APIRouter(prefix="/categories", tags=["categories"])


def _unique_slug(db: Session, base: str, exclude_id: uuid.UUID | None = None) -> str:
    slug, i = base, 2
    while True:
        q = db.query(Category.id).filter(Category.slug == slug, Category.deleted_at.is_(None))
        if exclude_id:
            q = q.filter(Category.id != exclude_id)
        if not q.first():
            return slug
        slug = f"{base}-{i}"; i += 1


def _get_or_404(db: Session, cat_id: uuid.UUID) -> Category:
    cat = db.query(Category).filter(Category.id == cat_id, Category.deleted_at.is_(None)).first()
    if not cat:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Рубрика не найдена")
    return cat


@router.get("", response_model=list[CategoryResponse])
def list_categories(db: Session = Depends(get_db)):
    """Публичный список рубрик (для блога и фильтров)."""
    return (
        db.query(Category)
        .filter(Category.deleted_at.is_(None))
        .order_by(Category.sort_order, Category.name)
        .all()
    )


@router.post("", response_model=CategoryResponse, status_code=201)
def create_category(body: CategoryCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    cat = Category(
        name=body.name,
        slug=_unique_slug(db, _slugify(body.name)),
        description=body.description,
        icon=body.icon,
        sort_order=body.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.patch("/{cat_id}", response_model=CategoryResponse)
def update_category(cat_id: uuid.UUID, body: CategoryUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    cat = _get_or_404(db, cat_id)
    data = body.model_dump(exclude_unset=True)
    if "name" in data and data["name"]:
        cat.name = data["name"]
        cat.slug = _unique_slug(db, _slugify(data["name"]), exclude_id=cat.id)
    for field in ("description", "icon", "sort_order"):
        if field in data:
            setattr(cat, field, data[field])
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/{cat_id}", status_code=204)
def delete_category(cat_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    cat = _get_or_404(db, cat_id)
    cat.deleted_at = datetime.now(timezone.utc)
    db.commit()
