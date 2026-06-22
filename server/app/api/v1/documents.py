import uuid
from typing import Optional
from fastapi import (
    APIRouter, Depends, HTTPException, Request, UploadFile,
    File as FastAPIFile, Form, Query, status,
)
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.core.limiter import limiter
from app.models.user import User, UserRole
from app.models.document import Document, DocumentType
from app.models.file import File
from app.schemas.document import DocumentResponse, DocumentUpdate
from app.services import document_service
from app.services.file_service import stream_file

router = APIRouter(prefix="/documents", tags=["documents"])


def _owner_or_admin(doc: Document, current_user: User) -> None:
    if current_user.role != UserRole.admin and doc.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Доступ запрещён")


@router.post("", response_model=DocumentResponse, status_code=201)
@limiter.limit("10/minute")
def create_document(
    request: Request,
    file: UploadFile = FastAPIFile(...),
    doc_type: DocumentType = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Загрузить документ с указанием его типа. ИИ сразу сверяет содержимое с типом."""
    return document_service.create_document(db, current_user, file, doc_type)


@router.get("", response_model=list[DocumentResponse])
def list_documents(
    user_id: Optional[uuid.UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список документов. Студент видит свои; админ может указать ?user_id=."""
    if current_user.role == UserRole.admin and user_id:
        target = user_id
    else:
        target = current_user.id
    return document_service.list_documents(db, target)


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = document_service.get_document_or_404(db, doc_id)
    _owner_or_admin(doc, current_user)
    return doc


@router.get("/{doc_id}/content")
def get_document_content(
    doc_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Открыть/просмотреть сам файл документа (стрим через бэкенд)."""
    doc = document_service.get_document_or_404(db, doc_id)
    _owner_or_admin(doc, current_user)
    record = db.get(File, doc.file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл не найден")
    return stream_file(
        record,
        request.headers.get("range"),
        cache_control="private, no-store",
        inline_filename=True,
    )


@router.patch("/{doc_id}", response_model=DocumentResponse)
@limiter.limit("10/minute")
def update_document(
    request: Request,
    doc_id: uuid.UUID,
    body: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Сменить заявленный тип документа — запускает повторную ИИ-проверку."""
    doc = document_service.get_document_or_404(db, doc_id)
    _owner_or_admin(doc, current_user)
    return document_service.update_document(db, doc, body.doc_type)


@router.post("/{doc_id}/reverify", response_model=DocumentResponse)
@limiter.limit("10/minute")
def reverify_document(
    request: Request,
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Перепроверить документ ИИ заново (по сохранённому файлу)."""
    doc = document_service.get_document_or_404(db, doc_id)
    _owner_or_admin(doc, current_user)
    return document_service.reverify(db, doc)


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = document_service.get_document_or_404(db, doc_id)
    _owner_or_admin(doc, current_user)
    document_service.delete_document(db, doc)
