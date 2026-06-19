import io
import logging
from datetime import datetime
from typing import Callable
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified

from app.api.deps import get_current_user, require_admin
from app.core.limiter import limiter
from app.db.session import get_db
from app.models.user import User
from app.services import ai_service

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger("ai_api")

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB for document images


def _ai_call(fn: Callable, *args, **kwargs):
    """Run an AI service call, mapping failures to clean HTTP errors (never a raw 500)."""
    try:
        return fn(*args, **kwargs)
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        logger.exception("AI call failed in %s: %s", getattr(fn, "__name__", fn), e)
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


class OnboardingRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=40)
    skipped: list[str] = Field(default_factory=list, max_length=20)


class BarashekRequest(BaseModel):
    message: str = Field(default="", max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=20)
    page: str = Field(default="", max_length=40)
    auto: bool = False


# ── Student endpoints ─────────────────────────────────────────────────────────


@router.post("/onboarding/chat")
@limiter.limit("30/minute")
def onboarding_chat(request: Request, req: OnboardingRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Диалог с персонажем «Барашек»: собирает профиль студента и сохраняет его."""
    history = [m.model_dump() for m in req.history]
    result = _ai_call(ai_service.onboarding_chat, db, user, req.message, history, req.skipped)

    # Применяем извлечённые AI данные к профилю студента
    updates = result.get("profile_updates") or {}
    for field, value in updates.items():
        if field == "date_of_birth":
            try:
                value = datetime.strptime(str(value), "%Y-%m-%d").date()
            except ValueError:
                continue
        setattr(user, field, value)

    # Сохраняем историю диалога и статус онбординга
    new_history = history + [
        {"role": "user", "content": req.message},
        {"role": "assistant", "content": result.get("reply", "")},
    ]
    user.onboarding_history = new_history[-40:]
    flag_modified(user, "onboarding_history")
    if result.get("completed"):
        user.is_onboarded = True

    db.commit()
    db.refresh(user)

    next_field = result.get("next_field", "")
    meta = ai_service.onboarding_field_meta(db, next_field)
    total = len(ai_service.ONBOARDING_ASK_ORDER)
    skipped_set = set(req.skipped)
    filled = sum(
        1 for f in ai_service.ONBOARDING_ASK_ORDER
        if getattr(user, f, None) not in (None, "", []) or f in skipped_set
    )

    return {
        "reply": result.get("reply", ""),
        "profile_updates": updates,
        "completed": bool(result.get("completed")),
        "is_onboarded": user.is_onboarded,
        "field": meta["field"],
        "field_type": meta["type"],
        "options": meta["options"],
        "skippable": meta["skippable"],
        "progress": {"filled": filled, "total": total},
    }




class InterviewRequest(BaseModel):
    message: str = Field(default="", max_length=4000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=24)


@router.post("/interview")
@limiter.limit("30/minute")
def interview(request: Request, req: InterviewRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Мок-интервью с Барашком."""
    history = [m.model_dump() for m in req.history]
    reply = _ai_call(ai_service.interview_coach, db, user, req.message, history)
    return {"reply": reply}


@router.post("/barashek")
@limiter.limit("40/minute")
def barashek(request: Request, req: BarashekRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Постоянный гид-ассистент «Барашек»: ведёт студента по системе."""
    if not req.auto and not req.message.strip():
        raise HTTPException(400, "Пустое сообщение")
    history = [m.model_dump() for m in req.history]
    reply = _ai_call(ai_service.barashek_guide, db, user, req.message, history, req.page, req.auto)
    return {"reply": reply}


class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=800)
    gender: str = "female"


@router.post("/tts")
@limiter.limit("80/minute")
def tts(request: Request, req: TTSRequest, user: User = Depends(get_current_user)):
    """Озвучка реплики Барашка (OpenAI TTS → ElevenLabs) → mp3."""
    audio = _ai_call(ai_service.text_to_speech, req.text, req.gender)
    return Response(content=audio, media_type="audio/mpeg", headers={"Cache-Control": "private, max-age=86400"})


@router.get("/barashek/tip")
@limiter.limit("20/minute")
def barashek_tip(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Короткая персональная подсказка от Барашка по профилю студента."""
    tip = _ai_call(ai_service.barashek_personal_tip, db, user)
    return {"tip": tip}


@router.get("/barashek/next-action")
@limiter.limit("60/minute")
def barashek_next_action(request: Request, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Одно конкретное следующее действие (детерминированно, без Groq)."""
    return ai_service.barashek_next_action(db, user)


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
    mime = file.content_type or ""
    fname = (file.filename or "").lower()
    low_mime = mime.lower()
    supported = (
        low_mime.startswith("image/") or low_mime.startswith("text/")
        or "pdf" in low_mime or "wordprocessingml" in low_mime
        or fname.endswith((".pdf", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".webp"))
    )
    if not supported:
        raise HTTPException(400, "Поддерживаются фото (JPG, PNG, WEBP), PDF, DOCX и TXT")
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "Файл слишком большой (максимум 10 МБ)")
    return _ai_call(ai_service.check_document_file, content, mime, fname)


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
