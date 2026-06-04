import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File as FastAPIFile, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User, UserRole
from app.models.file import File
from app.models.student_progress import StudentProgress
from app.models.student_requirement import StudentRequirement
from app.schemas.file import FileResponse
from app.services.file_service import upload_file, delete_file, stream_file

router = APIRouter(prefix="/files", tags=["files"])


def _user_can_access(db: Session, user: User, record: File) -> bool:
    """Object-level authorization. Shared content (lessons/universities/cases) is
    readable by any authenticated user; private `documents` only by their owner."""
    if user.role == UserRole.admin:
        return True
    if record.bucket != "documents":
        return True
    # The student who uploaded the document
    if record.uploaded_by == user.id:
        return True
    # The student's own contract (uploaded by an admin)
    if user.contract_file_id and record.id == user.contract_file_id:
        return True
    # A document attached to one of the student's requirement submissions
    linked = (
        db.query(StudentRequirement.id)
        .join(StudentProgress, StudentRequirement.student_progress_id == StudentProgress.id)
        .filter(StudentProgress.user_id == user.id, StudentRequirement.file_id == record.id)
        .first()
    )
    return linked is not None


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


@router.get("/{file_id}/content")
def get_content(
    file_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Stream file bytes through the backend (no presigned URL, MinIO stays hidden)."""
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    if not _user_can_access(db, current_user, record):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")
    return stream_file(
        record,
        request.headers.get("range"),
        cache_control="private, no-store",
        inline_filename=True,
    )


@router.delete("/{file_id}", status_code=204)
def remove_file(file_id: uuid.UUID, db: Session = Depends(get_db), _=Depends(require_admin)):
    record = db.get(File, file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    delete_file(db, record)
