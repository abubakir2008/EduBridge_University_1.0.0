import uuid
import enum
from sqlalchemy import Column, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class DocumentType(str, enum.Enum):
    """Тип документа, который СТУДЕНТ заявляет при загрузке.
    ИИ сверяет фактическое содержимое файла с этим заявленным типом."""
    passport = "passport"               # Паспорт / удостоверение личности
    certificate = "certificate"         # Аттестат о среднем образовании
    diploma = "diploma"                 # Диплom о высшем образовании
    transcript = "transcript"           # Транскрипт / выписка оценок
    language_certificate = "language_certificate"  # IELTS / TOEFL / HSK
    motivation_letter = "motivation_letter"        # Мотивационное письмо
    recommendation = "recommendation"   # Рекомендательное письмо
    photo = "photo"                     # Фото на документы
    medical = "medical"                 # Медицинская справка
    other = "other"                     # Прочее


class DocumentStatus(str, enum.Enum):
    pending = "pending"     # загружен, проверка ИИ ещё не завершена
    approved = "approved"   # ИИ подтвердил соответствие
    rejected = "rejected"   # ИИ нашёл несоответствие/проблемы


class Document(Base):
    """Документ студента: ссылка на хранимый файл + заявленный тип + вердикт ИИ.

    Файл лежит в MinIO (таблица `files`); здесь — бизнес-обёртка с типом,
    статусом и результатом проверки ИИ (вердикт + причины)."""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_id = Column(UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False)

    # Тип, заявленный студентом (что он СЧИТАЕТ этим документом)
    doc_type = Column(Enum(DocumentType), nullable=False, default=DocumentType.other)
    status = Column(Enum(DocumentStatus), nullable=False, default=DocumentStatus.pending)

    # Результат проверки ИИ
    detected_type = Column(String(100), nullable=True)   # что ИИ распознал по содержимому
    ai_verdict = Column(Text, nullable=True)             # краткое заключение
    ai_reasons = Column(JSONB, nullable=True)            # список причин (за/против)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    file = relationship("File")
    user = relationship("User")
