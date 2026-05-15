import uuid as _uuid
from datetime import timedelta
from io import BytesIO
from minio import Minio
from minio.error import S3Error
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings, MINIO_BUCKETS
from app.models.file import File

_client: Minio | None = None

# Magic bytes: (offset, bytes_to_match)
_MAGIC: list[tuple[int, bytes, str]] = [
    (0, b'%PDF',              'application/pdf'),
    (0, b'\xff\xd8\xff',      'image/jpeg'),
    (0, b'\x89PNG\r\n\x1a\n', 'image/png'),
    (0, b'GIF87a',            'image/gif'),
    (0, b'GIF89a',            'image/gif'),
    (0, b'RIFF',              'image/webp'),   # further check needed but acceptable
    (0, b'\x1aE\xdf\xa3',    'video/webm'),
    (0, b'PK\x03\x04',       'application/zip'),  # DOCX, XLSX, ZIP
    (0, b'\xd0\xcf\x11\xe0', 'application/msword'),  # DOC, XLS
    (4, b'ftyp',              'video/mp4'),
    (4, b'free',              'video/mp4'),
    (4, b'mdat',              'video/mp4'),
    (4, b'moov',              'video/mp4'),
    (4, b'wide',              'video/mp4'),
]

# Allowed MIME types per bucket
_BUCKET_ALLOWED: dict[str, set[str]] = {
    'documents': {
        'application/pdf',
        'image/jpeg', 'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
    },
    'lessons': {
        'video/mp4', 'video/webm',
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
    },
    'universities': {
        'image/jpeg', 'image/png', 'image/webp',
        'video/mp4', 'video/webm',
    },
    'media': {
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'video/mp4', 'video/webm',
    },
}


def _detect_mime(data: bytes) -> str | None:
    """Return detected MIME type from magic bytes, or None if unrecognised."""
    for offset, magic, mime in _MAGIC:
        end = offset + len(magic)
        if len(data) >= end and data[offset:end] == magic:
            return mime
    return None


def _validate_file(data: bytes, bucket: str, claimed_mime: str | None) -> None:
    detected = _detect_mime(data)
    allowed = _BUCKET_ALLOWED.get(bucket)

    if allowed is None:
        return  # unknown bucket, skip check

    if detected is None:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Тип файла не распознан. Загружайте только разрешённые форматы.",
        )

    if detected not in allowed:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Тип файла '{detected}' не разрешён для этого раздела.",
        )

    # Claimed MIME should match detected (prevents spoofing)
    if claimed_mime and claimed_mime != detected:
        # Some browsers send slightly different MIME strings — allow mp4/video mismatch
        both_video = detected.startswith('video/') and (claimed_mime or '').startswith('video/')
        both_image = detected.startswith('image/') and (claimed_mime or '').startswith('image/')
        if not (both_video or both_image):
            raise HTTPException(
                status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                "MIME-тип файла не соответствует его содержимому.",
            )


def get_minio() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
    return _client


def init_buckets() -> None:
    client = get_minio()
    for bucket in MINIO_BUCKETS:
        try:
            if not client.bucket_exists(bucket):
                client.make_bucket(bucket)
        except S3Error:
            pass


def upload_file(
    db: Session,
    upload: UploadFile,
    bucket: str,
    uploaded_by: _uuid.UUID,
) -> File:
    if bucket not in MINIO_BUCKETS:
        raise HTTPException(400, f"Invalid bucket. Allowed: {MINIO_BUCKETS}")

    data = upload.file.read()
    upload.file.seek(0)

    _validate_file(data, bucket, upload.content_type)

    client = get_minio()
    object_key = f"{_uuid.uuid4()}/{upload.filename}"
    size = len(data)

    client.put_object(
        bucket,
        object_key,
        BytesIO(data),
        size,
        content_type=upload.content_type or "application/octet-stream",
    )

    file_record = File(
        bucket=bucket,
        object_key=object_key,
        original_name=upload.filename or "file",
        mime_type=upload.content_type,
        uploaded_by=uploaded_by,
    )
    db.add(file_record)
    db.commit()
    db.refresh(file_record)
    return file_record


def get_presigned_url(file_record: File, expires_seconds: int = 3600) -> str:
    client = get_minio()
    url = client.presigned_get_object(
        file_record.bucket,
        file_record.object_key,
        expires=timedelta(seconds=expires_seconds),
    )
    return url


def delete_file(db: Session, file_record: File) -> None:
    client = get_minio()
    try:
        client.remove_object(file_record.bucket, file_record.object_key)
    except S3Error:
        pass
    db.delete(file_record)
    db.commit()
