import io
from typing import Callable
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB for document images


def _ai_call(fn: Callable, *args, **kwargs):
    """Run an AI service call, mapping failures to clean HTTP errors (never a raw 500)."""
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(503, str(e))
    except Exception:
        raise HTTPException(502, "AI-сервис временно недоступен. Попробуйте позже.")


# ── Request schemas (with input-size guards) ───────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(max_length=20)
    content: str = Field(max_length=8000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)


class LetterRequest(BaseModel):
    text: str = Field(min_length=1, max_length=20000)
    translate_to: str = Field(default="", max_length=50)


class AnalyticsRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)


class CompareRequest(BaseModel):
    university_ids: list[str] = Field(min_length=2, max_length=5)


# ── Student endpoints ─────────────────────────────────────────────────────────

@router.post("/chat")
@limiter.limit("20/minute")
def chat(request: Request, req: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    history = [m.model_dump() for m in req.history]
    reply = _ai_call(ai_service.student_chat, db, user, req.message, history)
    return {"reply": reply}


@router.post("/check-letter")
@limiter.limit("10/minute")
def check_letter(request: Request, req: LetterRequest, user: User = Depends(get_current_user)):
    result = _ai_call(ai_service.check_motivation_letter, req.text)
    if req.translate_to:
        result["translated"] = _ai_call(ai_service.translate_letter, req.text, req.translate_to)
    return result


@router.post("/check-document")
@limiter.limit("10/minute")
async def check_document(request: Request, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    mime = file.content_type or "image/jpeg"
    if not mime.startswith("image/"):
        raise HTTPException(400, "Поддерживаются только изображения (JPG, PNG, WEBP)")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл слишком большой (максимум 10 МБ)")
    return _ai_call(ai_service.check_document_image, content, mime)


@router.post("/extract-document")
@limiter.limit("10/minute")
async def extract_document(request: Request, file: UploadFile = File(...), user: User = Depends(get_current_user)):
    mime = file.content_type or "image/jpeg"
    if not mime.startswith("image/"):
        raise HTTPException(400, "Поддерживаются только изображения")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл слишком большой (максимум 10 МБ)")
    return _ai_call(ai_service.extract_profile_from_document, content, mime)


@router.get("/recommendations")
@limiter.limit("10/minute")
def recommendations(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = _ai_call(ai_service.recommend_universities, db, user)
    return {"universities": result}


@router.post("/compare-universities")
@limiter.limit("10/minute")
def compare_universities(request: Request, req: CompareRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return _ai_call(ai_service.compare_universities, db, user, req.university_ids)


@router.get("/reminders")
@limiter.limit("20/minute")
def reminders(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    result = _ai_call(ai_service.get_smart_reminders, db, user)
    return {"reminders": result}


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/summary/{user_id}")
@limiter.limit("30/minute")
def student_summary(request: Request, user_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _ai_call(ai_service.get_student_summary, db, user_id)


@router.post("/admin/analytics")
@limiter.limit("30/minute")
def analytics(request: Request, req: AnalyticsRequest, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _ai_call(ai_service.answer_analytics_query, db, req.question)


@router.post("/admin/reminder-draft/{user_id}")
@limiter.limit("30/minute")
def reminder_draft(request: Request, user_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _ai_call(ai_service.draft_reminder, db, user_id)


@router.get("/admin/admission-score/{user_id}")
@limiter.limit("30/minute")
def admission_score(request: Request, user_id: str, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return _ai_call(ai_service.get_admission_score, db, user_id)


@router.post("/admin/export")
@limiter.limit("10/minute")
def export_excel(request: Request, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    data = _ai_call(ai_service.export_students_excel, db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=students_export.xlsx"},
    )
