import uuid
from fastapi import APIRouter, Depends, Query, Request, UploadFile, File as FastAPIFile, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import require_admin, get_current_user
from app.models.user import User
from app.models.file import File
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListItem
from app.services import post_service
from app.services.file_service import upload_file, stream_file
from app.core.limiter import limiter

router = APIRouter(prefix="/posts", tags=["posts"])


# ── Публичные эндпоинты (блог открыт всем, важно для SEO) ──────────────────────

@router.get("", response_model=list[PostListItem])
def list_published(
    category: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    return post_service.list_posts(db, category=category, published_only=True, limit=limit, offset=offset)


@router.get("/cover/{file_id}")
def get_cover(file_id: uuid.UUID, request: Request, db: Session = Depends(get_db)):
    """Публичная отдача обложки статьи (без авторизации)."""
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(record, request.headers.get("range"), cache_control="public, max-age=86400")


@router.get("/{slug}", response_model=PostResponse)
def get_published(slug: str, db: Session = Depends(get_db)):
    return post_service.get_by_slug(db, slug, published_only=True)


# ── Админские эндпоинты ────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=list[PostResponse])
def list_all(
    category: str | None = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return post_service.list_posts(db, category=category, published_only=False, limit=limit, offset=offset)


@router.post("/cover", status_code=201)
@limiter.limit("30/minute")
def upload_cover(
    request: Request,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Загрузка обложки статьи (в бакет cases, изображения)."""
    record = upload_file(db, file, "cases", current_user.id)
    return {"file_id": str(record.id)}


@router.post("", response_model=PostResponse, status_code=201)
def create(body: PostCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return post_service.create_post(db, body.model_dump(exclude_unset=True), current_user.id)


@router.patch("/admin/{post_id}", response_model=PostResponse)
def update(post_id: uuid.UUID, body: PostUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    post = post_service.get_or_404(db, post_id)
    return post_service.update_post(db, post, body.model_dump(exclude_unset=True))


@router.delete("/admin/{post_id}", status_code=204)
def remove(post_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    post = post_service.get_or_404(db, post_id)
    post_service.delete_post(db, post)
