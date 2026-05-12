import uuid as _uuid
from datetime import timedelta
from minio import Minio
from minio.error import S3Error
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException
from app.core.config import settings, MINIO_BUCKETS
from app.models.file import File

_client: Minio | None = None


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

    client = get_minio()
    object_key = f"{_uuid.uuid4()}/{upload.filename}"

    data = upload.file.read()
    size = len(data)
    upload.file.seek(0)

    from io import BytesIO
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
