import uuid
from fastapi import APIRouter, Depends, Query, UploadFile, File as FastAPIFile, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.models.file import File
from app.schemas.university import (
    UniversityCreate, UniversityUpdate, UniversityResponse, MatchedUniversityResponse,
)
from app.schemas.stage import StageCreate, StageResponse
from app.services import university_service
from app.services import matching_service
from app.services.file_service import upload_file, get_minio, stream_file

router = APIRouter(prefix="/universities", tags=["universities"])


@router.get("", response_model=list[UniversityResponse])
def list_universities(
    search: str | None = Query(None),
    country: str | None = Query(None),
    specialty: str | None = Query(None),
    max_cost: int | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return university_service.list_universities(
        db, search=search, country=country, specialty=specialty,
        max_cost=max_cost, limit=limit, offset=offset,
    )


@router.get("/countries", response_model=list[str])
def get_countries(db: Session = Depends(get_db), _=Depends(get_current_user)):
    from app.models.university import University as UniModel
    rows = (
        db.query(UniModel.country)
        .filter(UniModel.deleted_at.is_(None), UniModel.country.isnot(None))
        .distinct()
        .order_by(UniModel.country)
        .all()
    )
    return [r[0] for r in rows if r[0]]


@router.get("/match", response_model=list[MatchedUniversityResponse])
def match(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    results = matching_service.match_universities(db, current_user)
    out = []
    for r in results:
        base = UniversityResponse.model_validate(r.university).model_dump()
        out.append(MatchedUniversityResponse(
            **base,
            match_score=r.score,
            match_tier=r.tier,
            match_reasons=r.reasons,
            match_gaps=r.gaps,
        ))
    return out


@router.post("", response_model=UniversityResponse, status_code=201)
def create_university(body: UniversityCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    return university_service.create_university(db, body)


@router.get("/{university_id}", response_model=UniversityResponse)
def get_university(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return university_service.get_university_or_404(db, university_id)


@router.patch("/{university_id}", response_model=UniversityResponse)
def update_university(
    university_id: uuid.UUID,
    body: UniversityUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    uni = university_service.get_university_or_404(db, university_id)
    return university_service.update_university(db, uni, body)


@router.delete("/{university_id}", status_code=204)
def delete_university(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    uni = university_service.get_university_or_404(db, university_id)
    university_service.delete_university(db, uni)


@router.get("/{university_id}/stages", response_model=list[StageResponse])
def get_stages(university_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(get_current_user)):
    uni = university_service.get_university_or_404(db, university_id)
    return uni.stages


@router.post("/{university_id}/stages", response_model=StageResponse, status_code=201)
def create_stage(
    university_id: uuid.UUID,
    body: StageCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    return university_service.create_stage(db, university_id, body)


# ── Фото университета ─────────────────────────────────────────────────────────

@router.post("/{university_id}/photos", status_code=201)
def upload_photo(
    university_id: uuid.UUID,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    uni = university_service.get_university_or_404(db, university_id)
    record = upload_file(db, file, "universities", current_user.id)
    ids = list(uni.photo_file_ids or [])
    ids.append(str(record.id))
    uni.photo_file_ids = ids
    db.commit()
    return {"file_id": str(record.id)}


@router.get("/{university_id}/photos/{file_id}")
def stream_photo(
    university_id: uuid.UUID,
    file_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(record, request.headers.get("range"), cache_control="private, max-age=3600")


@router.delete("/{university_id}/photos/{file_id}", status_code=204)
def delete_photo(
    university_id: uuid.UUID,
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    uni = university_service.get_university_or_404(db, university_id)
    ids = [i for i in (uni.photo_file_ids or []) if i != str(file_id)]
    uni.photo_file_ids = ids
    record = db.get(File, file_id)
    if record:
        try:
            get_minio().remove_object(record.bucket, record.object_key)
        except Exception:
            pass
        db.delete(record)
    db.commit()


# ── Видео университета ────────────────────────────────────────────────────────

MAX_VIDEO_SIZE = 500 * 1024 * 1024  # 500 МБ


@router.post("/{university_id}/video", status_code=201)
def upload_video(
    university_id: uuid.UUID,
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Size check before reading into memory
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > MAX_VIDEO_SIZE:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Максимальный размер видео — 500 МБ")

    uni = university_service.get_university_or_404(db, university_id)

    # Remove old video file if present
    if uni.video_file_id:
        old = db.get(File, uni.video_file_id)
        if old:
            try:
                get_minio().remove_object(old.bucket, old.object_key)
            except Exception:
                pass
            db.delete(old)

    # upload_file validates magic bytes + stores in MinIO
    record = upload_file(db, file, "universities", current_user.id)
    uni.video_file_id = record.id
    db.commit()
    return {"file_id": str(record.id)}


@router.get("/{university_id}/video")
def stream_video(
    university_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    uni = university_service.get_university_or_404(db, university_id)
    if not uni.video_file_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Видео не загружено")
    record = db.get(File, uni.video_file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(record, request.headers.get("range"), cache_control="private, max-age=3600")


@router.delete("/{university_id}/video", status_code=204)
def delete_video(
    university_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    uni = university_service.get_university_or_404(db, university_id)
    if uni.video_file_id:
        record = db.get(File, uni.video_file_id)
        if record:
            try:
                get_minio().remove_object(record.bucket, record.object_key)
            except Exception:
                pass
            db.delete(record)
        uni.video_file_id = None
    db.commit()
