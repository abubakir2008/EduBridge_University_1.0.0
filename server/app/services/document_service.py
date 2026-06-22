import uuid
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentType, DocumentStatus
from app.models.file import File
from app.models.user import User
from app.services import ai_service, file_service


def _verdict_reasons(result: dict) -> list[str]:
    """Единый список причин (за/против) + проблемы, без дублей."""
    reasons = list(result.get("reasons") or [])
    for issue in result.get("issues") or []:
        line = f"Проблема: {issue}"
        if issue not in reasons and line not in reasons:
            reasons.append(line)
    return reasons


def _apply_verdict(doc: Document, result: dict) -> None:
    doc.status = DocumentStatus(result.get("status", "rejected"))
    doc.detected_type = result.get("detected_type")
    doc.ai_verdict = result.get("verdict")
    doc.ai_reasons = _verdict_reasons(result)


def create_document(db: Session, user: User, upload: UploadFile, doc_type: DocumentType) -> Document:
    # 1. Сохраняем файл (валидация формата/размера внутри upload_file)
    record = file_service.upload_file(db, upload, "documents", user.id)

    # 2. Читаем байты для ИИ (upload_file оставляет курсор в начале)
    upload.file.seek(0)
    content = upload.file.read()

    # 3. ИИ-проверка с учётом заявленного типа и метаданных
    result = ai_service.verify_document(
        content,
        mime=upload.content_type or "",
        filename=upload.filename or "",
        expected_type=doc_type.value,
        file_size=len(content),
    )

    doc = Document(user_id=user.id, file_id=record.id, doc_type=doc_type)
    _apply_verdict(doc, result)
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


def list_documents(db: Session, user_id: uuid.UUID) -> list[Document]:
    return (
        db.query(Document)
        .filter(Document.user_id == user_id)
        .order_by(Document.created_at.desc())
        .all()
    )


def get_document_or_404(db: Session, doc_id: uuid.UUID) -> Document:
    doc = db.get(Document, doc_id)
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Документ не найден")
    return doc


def reverify(db: Session, doc: Document) -> Document:
    """Повторная ИИ-проверка по сохранённому файлу (после смены типа или вручную)."""
    record = db.get(File, doc.file_id)
    if not record:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Файл документа не найден")
    content = file_service.get_file_bytes(record)
    result = ai_service.verify_document(
        content,
        mime=record.mime_type or "",
        filename=record.original_name or "",
        expected_type=doc.doc_type.value,
        file_size=len(content),
    )
    _apply_verdict(doc, result)
    db.commit()
    db.refresh(doc)
    return doc


def update_document(db: Session, doc: Document, doc_type: DocumentType) -> Document:
    """Сменить заявленный тип и перепроверить документ под новый тип."""
    doc.doc_type = doc_type
    return reverify(db, doc)


def delete_document(db: Session, doc: Document) -> None:
    record = db.get(File, doc.file_id)
    if record:
        # Удаление файла каскадно (ON DELETE CASCADE) уберёт и строку документа
        file_service.delete_file(db, record)
    else:
        db.delete(doc)
        db.commit()
