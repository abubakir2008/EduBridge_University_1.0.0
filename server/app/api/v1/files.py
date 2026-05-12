import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.file import File
from app.schemas.file import FileResponse, FileURLResponse
from app.services.file_service import upload_file, get_presigned_url, delete_file
from app.core.config import MINIO_BUCKETS

router = APIRouter(prefix="/files", tags=["files"])

PRESIGNED_EXPIRES = 3600


@router.post("/upload", response_model=FileResponse, status_code=201)
def upload(
    file: UploadFile = FastAPIFile(...),
    bucket: str = Query("documents"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.admin and bucket != "documents":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Студенты могут загружать только в documents")
    record = upload_file(db, file, bucket, current_user.id)
    return record


@router.get("/{file_id}/url", response_model=FileURLResponse)
def get_url(
    file_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    url = get_presigned_url(record, PRESIGNED_EXPIRES)
    return FileURLResponse(url=url, expires_in_seconds=PRESIGNED_EXPIRES)


@router.delete("/{file_id}", status_code=204)
def remove_file(file_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    delete_file(db, record)
