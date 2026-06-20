import re
import uuid as _uuid
from io import BytesIO
from minio import Minio
from minio.error import S3Error
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from fastapi.responses import StreamingResponse
from app.core.config import settings, MINIO_BUCKETS
from app.models.file import File

_STREAM_CHUNK = 64 * 1024
_RANGE_RE = re.compile(r"bytes=(\d+)-(\d*)")

_client: Minio | None = None

# Magic bytes: (offset, bytes_to_match, mime)
_MAGIC: list[tuple[int, bytes, str]] = [
    (0, b'%PDF',              'application/pdf'),
    (0, b'\xff\xd8\xff',      'image/jpeg'),
    (0, b'\x89PNG\r\n\x1a\n', 'image/png'),
    (0, b'GIF87a',            'image/gif'),
    (0, b'GIF89a',            'image/gif'),
    (0, b'\x1aE\xdf\xa3',    'video/webm'),   # WebM / MKV (same EBML header)
    (0, b'PK\x03\x04',       'application/zip'),  # DOCX, XLSX, ZIP
    (0, b'\xd0\xcf\x11\xe0', 'application/msword'),  # DOC, XLS
    # MP4 family: ftyp box is usually the first box (at offset 4 after 4-byte size)
    (4, b'ftyp',              'video/mp4'),
    (4, b'free',              'video/mp4'),
    (4, b'mdat',              'video/mp4'),
    (4, b'moov',              'video/mp4'),
    (4, b'wide',              'video/mp4'),
    # Some MP4s have an 8-byte extended size prefix before ftyp
    (12, b'ftyp',             'video/mp4'),
    # RIFF container — check sub-type at offset 8
    (8, b'WEBP',              'image/webp'),
    (8, b'AVI ',              'video/mp4'),    # treat AVI as generic video
    (8, b'WAVE',              'audio/wav'),
]

# Максимальный размер загрузки на bucket (защита от DoS / переполнения памяти).
# documents — только PDF/фото/DOCX; остальные buckets допускают видео.
_DEFAULT_MAX_SIZE = 25 * 1024 * 1024  # 25 МБ
_BUCKET_MAX_SIZE: dict[str, int] = {
    'documents': 25 * 1024 * 1024,     # 25 МБ
    'lessons': 500 * 1024 * 1024,      # 500 МБ — видео уроков
    'universities': 500 * 1024 * 1024,  # 500 МБ — промо-видео вузов
    'media': 500 * 1024 * 1024,        # 500 МБ
}

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
        # Magic bytes didn't match — fall back to claimed MIME for video/image types.
        # Browsers reliably report video/* and image/* so this is safe for media buckets.
        if claimed_mime and claimed_mime in allowed:
            return
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            "Тип файла не поддерживается. Загружайте MP4, WebM, JPG, PNG или PDF.",
        )

    if detected not in allowed:
        raise HTTPException(
            status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            f"Тип файла не разрешён для этого раздела.",
        )

    # Claimed MIME should roughly match detected (prevents spoofing)
    if claimed_mime and claimed_mime != detected:
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

    # Проверяем размер ДО чтения файла в память (иначе read() = DoS-вектор).
    max_size = _BUCKET_MAX_SIZE.get(bucket, _DEFAULT_MAX_SIZE)
    upload.file.seek(0, 2)  # в конец
    size = upload.file.tell()
    upload.file.seek(0)
    if size > max_size:
        raise HTTPException(
            status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            f"Файл слишком большой (максимум {max_size // (1024 * 1024)} МБ)",
        )

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


def _iter_minio(resp):
    """Yield object bytes and always release the underlying connection."""
    try:
        for chunk in resp.stream(_STREAM_CHUNK):
            yield chunk
    finally:
        resp.close()
        resp.release_conn()


def stream_file(
    file_record: File,
    range_header: str | None = None,
    *,
    cache_control: str | None = None,
    inline_filename: bool = False,
) -> StreamingResponse:
    """Stream a stored object through the backend.

    The MinIO endpoint is never exposed to the client — every byte is proxied here,
    so callers (and pentesters) only ever see our own API URL. Supports HTTP Range
    requests for media seeking and always closes the upstream connection."""
    client = get_minio()
    stat = client.stat_object(file_record.bucket, file_record.object_key)
    file_size = stat.size
    media_type = file_record.mime_type or "application/octet-stream"

    headers = {"Accept-Ranges": "bytes"}
    if cache_control:
        headers["Cache-Control"] = cache_control
    if inline_filename:
        safe = (file_record.original_name or "file").encode("utf-8").decode("latin-1", errors="replace")
        headers["Content-Disposition"] = f'inline; filename="{safe}"'

    if range_header:
        m = _RANGE_RE.match(range_header)
        if m:
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else file_size - 1
            end = min(end, file_size - 1)
            length = end - start + 1
            resp = client.get_object(
                file_record.bucket, file_record.object_key, offset=start, length=length
            )
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            headers["Content-Length"] = str(length)
            return StreamingResponse(
                _iter_minio(resp), status_code=206, media_type=media_type, headers=headers
            )

    resp = client.get_object(file_record.bucket, file_record.object_key)
    headers["Content-Length"] = str(file_size)
    return StreamingResponse(_iter_minio(resp), media_type=media_type, headers=headers)


def delete_file(db: Session, file_record: File) -> None:
    client = get_minio()
    try:
        client.remove_object(file_record.bucket, file_record.object_key)
    except S3Error:
        pass
    db.delete(file_record)
    db.commit()
