import base64
import io
import json
import uuid
from datetime import date
from typing import Optional

from groq import Groq
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.student_progress import StudentProgress, ProgressStatus
from app.models.student_requirement import StudentRequirement
from app.models.student_stage_deadline import StudentStageDeadline
from app.models.stage import Stage
from app.models.requirement import Requirement
from app.models.university import University
from app.models.user import User, AccountStatus

TEXT_MODEL = "llama-3.3-70b-versatile"
VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct-fp8"


def _gpa_percent(gpa: Optional[float]) -> int:
    """Normalize a GPA to a 0-100 score, auto-detecting the source scale.

    Supports the common 4.0, 5.0, 10 and 100-point scales."""
    if not gpa or gpa <= 0:
        return 0
    if gpa <= 4.0:
        scale = 4.0
    elif gpa <= 5.0:
        scale = 5.0
    elif gpa <= 10.0:
        scale = 10.0
    else:
        scale = 100.0
    return min(100, int(gpa / scale * 100))


GROQ_TIMEOUT = 30  # seconds — avoid a slow upstream tying up a worker thread


def _client() -> Groq:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY не задан в настройках")
    return Groq(api_key=settings.GROQ_API_KEY, timeout=GROQ_TIMEOUT)


def _complete(messages: list, model: str = TEXT_MODEL, max_tokens: int = 2048) -> str:
    resp = _client().chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7,
    )
    return resp.choices[0].message.content.strip()


def _extract_json(text: str, opener: str, closer: str) -> str:
    """Pull the first balanced JSON object/array out of an LLM reply.

    Handles ```json fences and any leading/trailing prose the model adds."""
    text = text.strip()
    if "```" in text:
        # Take the content of the first fenced block
        parts = text.split("```")
        if len(parts) >= 2:
            block = parts[1]
            if block.lower().startswith("json"):
                block = block[4:]
            text = block.strip()
    start = text.find(opener)
    end = text.rfind(closer)
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _parse_json(text: str, fallback: dict) -> dict:
    try:
        result = json.loads(_extract_json(text, "{", "}"))
        return result if isinstance(result, dict) else fallback
    except Exception:
        return fallback


def _parse_json_list(text: str) -> list:
    try:
        result = json.loads(_extract_json(text, "[", "]"))
        return result if isinstance(result, list) else []
    except Exception:
        return []


# ── Context builder ───────────────────────────────────────────────────────────

def _build_student_context(db: Session, user: User) -> str:
    lines = [
        f"Студент: {user.full_name}",
        f"GPA: {user.gpa or 'не указан'}",
        f"IELTS: {user.ielts_score or 'не указан'}",
        f"TOEFL: {user.toefl_score or 'не указан'}",
        f"SAT: {user.sat_score or 'не указан'}",
        f"HSK: {f'уровень {user.hsk_level}' if user.hsk_level else 'не сдавал'}",
        f"Гражданство: {user.citizenship or 'не указано'}",
        f"Желаемая специальность: {user.desired_specialty or 'не указана'}",
        f"Предпочтительные страны: {', '.join(user.country_preference) if user.country_preference else 'не указаны'}",
        f"Уровень программы: {user.program_level or 'не указан'}",
        f"Языковой год: {user.wants_language_year or 'не указан'}",
        f"Предпочитаемая сложность: {user.preferred_difficulty or 'не указана'}",
        f"Макс. бюджет (RMB/год): {user.max_budget_rmb or 'не указан'}",
        f"Достижения: {user.achievements or 'не указаны'}",
    ]

    progress = db.query(StudentProgress).filter(
        StudentProgress.user_id == user.id,
        StudentProgress.status == ProgressStatus.in_progress,
    ).first()

    if progress:
        uni = db.get(University, progress.university_id)
        if uni:
            lines.append(f"Выбранный университет: {uni.name} ({uni.country}, {uni.city}), рейтинг: {uni.rating or 'нет'}, стоимость: ${uni.cost or 'нет'}/год")

        if progress.current_stage_id:
            stage = db.get(Stage, progress.current_stage_id)
            if stage:
                lines.append(f"Текущий этап: {stage.name} (этап №{stage.order})")

                ssd = db.query(StudentStageDeadline).filter(
                    StudentStageDeadline.student_progress_id == progress.id,
                    StudentStageDeadline.stage_id == stage.id,
                ).first()
                if ssd:
                    days_left = (ssd.deadline - date.today()).days
                    if days_left > 0:
                        lines.append(f"Дней до дедлайна: {days_left}")
                    else:
                        lines.append(f"⚠️ Дедлайн просрочен на {abs(days_left)} дней!")

                reqs = db.query(Requirement).filter(Requirement.stage_id == stage.id).all()
                # One query for all completed requirements of this progress (avoids N+1)
                done_req_ids = {
                    row[0] for row in db.query(StudentRequirement.requirement_id).filter(
                        StudentRequirement.student_progress_id == progress.id,
                        StudentRequirement.completed == True,  # noqa: E712
                    ).all()
                }
                unfulfilled = [req.name for req in reqs if req.id not in done_req_ids]
                if unfulfilled:
                    lines.append(f"Не выполненные требования: {', '.join(unfulfilled)}")
                else:
                    lines.append("Все требования текущего этапа выполнены.")
    else:
        lines.append("Студент ещё не выбрал университет для поступления.")

    return "\n".join(lines)


# ── Feature 1: Student chat ───────────────────────────────────────────────────

def student_chat(db: Session, user: User, message: str, history: list) -> str:
    context = _build_student_context(db, user)
    system = (
        "Ты AI-ассистент платформы EduBridge University — помогаешь студентам с поступлением в зарубежные университеты.\n"
        "Отвечай только на русском языке. Будь конкретным, дружелюбным и полезным.\n"
        "Если студент спрашивает о требованиях — ссылайся на его текущий этап.\n\n"
        f"Информация о студенте:\n{context}"
    )
    messages = [{"role": "system", "content": system}]
    for h in history[-10:]:
        if h.get("role") in ("user", "assistant"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": message})
    return _complete(messages)


# ── Feature 2: Check motivation letter ───────────────────────────────────────

def check_motivation_letter(text: str) -> dict:
    prompt = (
        "Ты эксперт по поступлению в зарубежные университеты. Проверь мотивационное письмо.\n"
        "Ответь строго в формате JSON (только JSON, без markdown):\n"
        '{"score": <1-10>, "strengths": ["..."], "weaknesses": ["..."], "suggestions": ["..."], "verdict": "краткое резюме"}\n\n'
        f"Мотивационное письмо:\n{text}"
    )
    raw = _complete([{"role": "user", "content": prompt}])
    return _parse_json(raw, {
        "score": 0, "strengths": [], "weaknesses": [],
        "suggestions": ["Не удалось проанализировать"], "verdict": raw[:200]
    })


# ── Feature 3: Check document image ──────────────────────────────────────────

def check_document_image(image_bytes: bytes, mime_type: str) -> dict:
    b64 = base64.standard_b64encode(image_bytes).decode()
    messages = [{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            {
                "type": "text",
                "text": (
                    "Проверь этот документ. Ответь строго в формате JSON (без markdown):\n"
                    '{"ok": true/false, "document_type": "тип", "issues": ["..."], '
                    '"empty_fields": ["..."], "verdict": "заключение", "recommendations": ["..."]}'
                ),
            },
        ],
    }]
    raw = _complete(messages, model=VISION_MODEL)
    return _parse_json(raw, {
        "ok": False, "document_type": "Неизвестно", "issues": [raw[:200]],
        "empty_fields": [], "verdict": "Ошибка анализа", "recommendations": []
    })


# ── Feature 4: Extract profile from document image ───────────────────────────

def extract_profile_from_document(image_bytes: bytes, mime_type: str) -> dict:
    b64 = base64.standard_b64encode(image_bytes).decode()
    messages = [{
        "role": "user",
        "content": [
            {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
            {
                "type": "text",
                "text": (
                    "Извлеки данные из этого документа. Ответь строго в формате JSON (без markdown):\n"
                    '{"full_name": "...", "date_of_birth": "YYYY-MM-DD или null", '
                    '"citizenship": "...", "gpa": null, "ielts_score": null, "sat_score": null}'
                    "\nЕсли поле не найдено — null."
                ),
            },
        ],
    }]
    raw = _complete(messages, model=VISION_MODEL)
    return _parse_json(raw, {})


# ── Feature 5: University recommendations ────────────────────────────────────

def recommend_universities(db: Session, user: User) -> list:
    unis = db.query(University).filter(University.deleted_at.is_(None)).limit(30).all()

    def _uni_line(u: University) -> str:
        specs_cn = ", ".join(u.programs_bachelor_chinese or []) if u.programs_bachelor_chinese else ""
        specs_en = ", ".join(u.programs_bachelor_english or []) if u.programs_bachelor_english else ""
        specs_old = ", ".join(u.specialties) if u.specialties else ""
        specs = specs_cn or specs_en or specs_old or "не указаны"

        tuition = u.tuition_bachelor or u.cost
        budget_ok = ""
        if user.max_budget_rmb and tuition:
            budget_ok = " [БЮДЖЕТ ОК]" if tuition <= user.max_budget_rmb else " [ДОРОГО]"

        return (
            f"- {u.name} ({u.country}, {u.city})"
            f", сложность: {u.difficulty or '?'}"
            f", рейтинг: {u.rating or '?'}"
            f", стоимость бакалавриат: {tuition or '?'} RMB/год{budget_ok}"
            f", языковой год: {'да' if u.has_language_year else 'нет'}"
            f", дедлайн: {u.deadline or '?'}"
            f", специальности: {specs[:120]}"
            f", мин. требования: {(u.min_requirements or '')[:80]}"
        )

    uni_list = "\n".join(_uni_line(u) for u in unis)
    context = _build_student_context(db, user)
    prompt = (
        "Подбери топ-5 подходящих университетов для студента с учётом его бюджета, уровня программы, "
        "желаемой специальности и предпочитаемой сложности. "
        "Ответь строго в формате JSON-массив (без markdown):\n"
        '[{"name": "...", "match_percent": 85, "reasons": ["..."], "concerns": ["..."]}]\n\n'
        f"Профиль студента:\n{context}\n\nДоступные университеты:\n{uni_list}"
    )
    raw = _complete([{"role": "user", "content": prompt}])
    return _parse_json_list(raw)


# ── Feature 6: Translate motivation letter ────────────────────────────────────

def translate_letter(text: str, target_language: str = "английский") -> str:
    prompt = (
        f"Переведи это мотивационное письмо на {target_language}. "
        "Сохрани стиль и структуру. Верни только перевод без пояснений.\n\n"
        f"{text}"
    )
    return _complete([{"role": "user", "content": prompt}], max_tokens=3000)


# ── Feature 7: Smart reminders ────────────────────────────────────────────────

def get_smart_reminders(db: Session, user: User) -> list:
    context = _build_student_context(db, user)
    prompt = (
        "На основе статуса студента сформулируй 2-4 персональных напоминания. "
        "Ответь строго в формате JSON-массив (без markdown):\n"
        '[{"priority": "high/medium/low", "icon": "📋", "message": "текст"}]\n\n'
        f"Статус студента:\n{context}"
    )
    raw = _complete([{"role": "user", "content": prompt}])
    result = _parse_json_list(raw)
    if not result:
        return [{"priority": "medium", "icon": "ℹ️", "message": "Проверьте ваш прогресс в личном кабинете"}]
    return result


# ── Feature 8: Admin — student summary ───────────────────────────────────────

def get_student_summary(db: Session, user_id: str) -> dict:
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        return {"summary": "Студент не найден", "action_items": [], "risk_level": "low", "recommendation": ""}
    context = _build_student_context(db, user)
    prompt = (
        "Ты менеджер образовательного агентства. Составь краткую сводку по студенту для коллеги.\n"
        "Ответь строго в формате JSON (без markdown):\n"
        '{"summary": "3-4 предложения", "action_items": ["..."], '
        '"risk_level": "low/medium/high", "recommendation": "главная рекомендация"}\n\n'
        f"Данные:\n{context}"
    )
    raw = _complete([{"role": "user", "content": prompt}])
    return _parse_json(raw, {
        "summary": raw[:300], "action_items": [], "risk_level": "medium", "recommendation": ""
    })


# ── Feature 10: Admin — analytics ────────────────────────────────────────────

def answer_analytics_query(db: Session, question: str) -> dict:
    from sqlalchemy import func
    from app.models.lead import Lead

    student_filter = (User.role == "student", User.deleted_at.is_(None))
    total_students = db.query(func.count(User.id)).filter(*student_filter).scalar() or 0
    active = db.query(func.count(User.id)).filter(
        *student_filter, User.account_status == AccountStatus.active
    ).scalar() or 0
    enrolled = db.query(func.count(User.id)).filter(
        *student_filter, User.account_status == AccountStatus.enrolled
    ).scalar() or 0
    archived = db.query(func.count(User.id)).filter(
        *student_filter, User.account_status == AccountStatus.archived
    ).scalar() or 0
    total_leads = db.query(func.count(Lead.id)).scalar() or 0

    avg_gpa = round(db.query(func.avg(User.gpa)).filter(*student_filter).scalar() or 0, 2)
    avg_ielts = round(db.query(func.avg(User.ielts_score)).filter(*student_filter).scalar() or 0, 1)

    progresses = db.query(StudentProgress).filter(StudentProgress.status == ProgressStatus.in_progress).all()

    # Batch-load related stages/universities to avoid N+1
    stage_ids = {p.current_stage_id for p in progresses if p.current_stage_id}
    uni_ids = {p.university_id for p in progresses if p.university_id}
    stage_names = {s.id: s.name for s in db.query(Stage).filter(Stage.id.in_(stage_ids)).all()} if stage_ids else {}
    uni_names = {u.id: u.name for u in db.query(University).filter(University.id.in_(uni_ids)).all()} if uni_ids else {}

    today = date.today()
    overdue_pairs = {
        (d.student_progress_id, d.stage_id)
        for d in db.query(StudentStageDeadline).filter(StudentStageDeadline.deadline < today).all()
    }

    stage_dist: dict = {}
    uni_students: dict = {}
    overdue = 0
    for p in progresses:
        if p.current_stage_id:
            name = stage_names.get(p.current_stage_id)
            if name:
                stage_dist[name] = stage_dist.get(name, 0) + 1
            if (p.id, p.current_stage_id) in overdue_pairs:
                overdue += 1
        uname = uni_names.get(p.university_id)
        if uname:
            uni_students[uname] = uni_students.get(uname, 0) + 1

    uni_filter = (University.deleted_at.is_(None),)
    unis_count = db.query(func.count(University.id)).filter(*uni_filter).scalar() or 0

    uni_by_country = {
        (country or "не указана"): cnt
        for country, cnt in db.query(University.country, func.count(University.id))
        .filter(*uni_filter)
        .group_by(University.country)
        .order_by(func.count(University.id).desc())
        .all()
    }
    uni_by_difficulty = {
        (diff or "не указана"): cnt
        for diff, cnt in db.query(University.difficulty, func.count(University.id))
        .filter(*uni_filter)
        .group_by(University.difficulty)
        .all()
    }
    uni_with_language_year = db.query(func.count(University.id)).filter(
        *uni_filter, University.has_language_year.is_(True)
    ).scalar() or 0

    db_context = (
        f"Данные системы EduBridge:\n"
        f"- Студентов всего: {total_students} (активных: {active}, поступили: {enrolled}, архив: {archived})\n"
        f"- Заявок (лидов): {total_leads}\n"
        f"- Средний GPA: {avg_gpa}, средний IELTS: {avg_ielts}\n"
        f"- Просроченных дедлайнов: {overdue}\n"
        f"- Распределение по этапам: {stage_dist}\n"
        f"- Студентов по университетам: {uni_students}\n"
        f"- Университетов в базе: {unis_count}\n"
        f"- Университетов по странам: {uni_by_country}\n"
        f"- Университетов по сложности поступления: {uni_by_difficulty}\n"
        f"- Университетов с языковым годом: {uni_with_language_year}"
    )

    is_export = any(w in question.lower() for w in ["экспорт", "excel", "xlsx", "скачать", "выгрузи", "список студентов"])

    prompt = (
        "Ты аналитик образовательной платформы. Ответь на вопрос администратора, используя данные системы.\n"
        "Отвечай по-русски. Будь конкретным, давай цифры и факты.\n\n"
        f"{db_context}\n\nВопрос: {question}"
    )
    answer = _complete([{"role": "user", "content": prompt}])
    return {"answer": answer, "can_export": is_export}


# ── Feature 11: Admin — reminder draft ───────────────────────────────────────

def draft_reminder(db: Session, user_id: str) -> dict:
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        return {"draft": "", "user_name": ""}
    context = _build_student_context(db, user)
    prompt = (
        "Напиши персональное напоминание от менеджера образовательного агентства студенту. "
        "Тон: профессиональный, но дружелюбный. Длина: 2-3 предложения. Только текст сообщения.\n\n"
        f"Данные студента:\n{context}"
    )
    draft = _complete([{"role": "user", "content": prompt}])
    return {"draft": draft, "user_name": user.full_name}


# ── Feature 12: Admission score ───────────────────────────────────────────────

def get_admission_score(db: Session, user_id: str) -> dict:
    user = db.get(User, uuid.UUID(user_id))
    if not user:
        return {"score": 0, "breakdown": {}, "verdict": "Студент не найден", "weak_points": [], "strong_points": [], "recommendations": []}

    gpa_score = _gpa_percent(user.gpa)
    # Best available English score: IELTS or TOEFL
    ielts_score = min(100, int((user.ielts_score or 0) / 9.0 * 100))
    toefl_score_norm = min(100, int((user.toefl_score or 0) / 120 * 100)) if user.toefl_score else 0
    english_score = max(ielts_score, toefl_score_norm)
    sat_score = min(100, int((user.sat_score or 0) / 1600 * 100)) if user.sat_score else 0
    hsk_score = min(100, int((user.hsk_level or 0) / 6 * 100)) if user.hsk_level else 0
    # Boost from HSK (Chinese universities bonus)
    lang_bonus = max(english_score, hsk_score)
    profile_fields = [user.gpa, user.ielts_score or user.toefl_score, user.citizenship,
                      user.desired_specialty, user.country_preference, user.achievements,
                      user.email, user.phone, user.program_level, user.max_budget_rmb]
    completeness = int(sum(1 for f in profile_fields if f) / len(profile_fields) * 100)
    overall = int(gpa_score * 0.30 + lang_bonus * 0.30 + sat_score * 0.15 + hsk_score * 0.10 + completeness * 0.15)

    context = _build_student_context(db, user)
    prompt = (
        "Оцени шансы студента на поступление в зарубежный университет. "
        "Ответь строго в формате JSON (без markdown):\n"
        '{"verdict": "2-3 предложения", "weak_points": ["..."], "strong_points": ["..."], "recommendations": ["..."]}\n\n'
        f"Данные:\n{context}\n"
        f"Расчётный балл: {overall}/100 (GPA: {gpa_score}/100, Английский: {english_score}/100, "
        f"HSK: {hsk_score}/100, SAT: {sat_score}/100, профиль: {completeness}/100)"
    )
    raw = _complete([{"role": "user", "content": prompt}])
    ai = _parse_json(raw, {"verdict": raw[:300], "weak_points": [], "strong_points": [], "recommendations": []})

    return {
        "score": overall,
        "breakdown": {
            "gpa": gpa_score,
            "english": english_score,
            "hsk": hsk_score,
            "sat": sat_score,
            "completeness": completeness,
        },
        "verdict": ai.get("verdict", ""),
        "weak_points": ai.get("weak_points", []),
        "strong_points": ai.get("strong_points", []),
        "recommendations": ai.get("recommendations", []),
    }


# ── Compare universities with AI ─────────────────────────────────────────────

def compare_universities(db: Session, user: User, university_ids: list[str]) -> dict:
    unis = [db.get(University, uuid.UUID(uid)) for uid in university_ids]
    unis = [u for u in unis if u]

    uni_blocks = []
    for u in unis:
        specs_cn = ", ".join(u.programs_bachelor_chinese or []) if u.programs_bachelor_chinese else ""
        specs_en = ", ".join(u.programs_bachelor_english or []) if u.programs_bachelor_english else ""
        specs_old = ", ".join(u.specialties) if u.specialties else ""
        specs = specs_cn or specs_en or specs_old or "не указаны"
        docs = ", ".join(u.documents_bachelor or []) if u.documents_bachelor else "не указаны"
        uni_blocks.append(
            f"- {u.name} ({u.country}, {u.city})\n"
            f"  Рейтинг: {u.rating or 'нет'}, Сложность: {u.difficulty or 'не указана'}\n"
            f"  Стоимость бакалавриат: {u.tuition_bachelor or u.cost or 'нет'} RMB/год"
            f"{f', магистратура: {u.tuition_masters} RMB/год' if u.tuition_masters else ''}\n"
            f"  Языковой год: {'доступен' if u.has_language_year else 'нет'}"
            f"{f', стоимость: {u.tuition_language_year} RMB/год' if u.tuition_language_year else ''}\n"
            f"  Дедлайн: {u.deadline or 'не указан'}\n"
            f"  Мин. требования: {(u.min_requirements or 'не указаны')[:150]}\n"
            f"  Специальности: {specs[:150]}\n"
            f"  Документы: {docs[:150]}\n"
            f"  Общежитие: {(u.dormitory_info or 'не указано')[:100]}\n"
            f"  Описание: {(u.description or '')[:150]}"
        )

    student_ctx = _build_student_context(db, user)

    prompt = (
        "Ты эксперт по поступлению в зарубежные университеты. "
        "Сравни университеты и дай персональный анализ для конкретного студента.\n"
        "Ответь строго в формате JSON (без markdown):\n"
        "{\n"
        '  "winner": "название лучшего университета для этого студента",\n'
        '  "winner_reason": "2-3 предложения почему именно он",\n'
        '  "per_university": [\n'
        '    {"name": "...", "pros": ["..."], "cons": ["..."], "admission_chance": "высокие/средние/низкие", "fit_score": 85}\n'
        "  ],\n"
        '  "advice": "главный совет студенту по выбору",\n'
        '  "red_flags": ["риск 1", "риск 2"]\n'
        "}\n\n"
        f"Профиль студента:\n{student_ctx}\n\n"
        f"Сравниваемые университеты:\n" + "\n".join(uni_blocks)
    )

    raw = _complete([{"role": "user", "content": prompt}], max_tokens=2048)
    return _parse_json(raw, {
        "winner": "",
        "winner_reason": raw[:300],
        "per_university": [],
        "advice": "",
        "red_flags": [],
    })


# ── Admin Excel export ────────────────────────────────────────────────────────

def export_students_excel(db: Session) -> bytes:
    import openpyxl

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Студенты"

    headers = ["ФИО", "Логин", "Email", "Телефон", "GPA", "IELTS", "SAT",
               "Статус", "Специальность", "Гражданство", "Дата регистрации"]
    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col, value=h)
        cell.font = openpyxl.styles.Font(bold=True)

    students = db.query(User).filter(User.role == "student", User.deleted_at.is_(None)).all()
    for row, s in enumerate(students, 2):
        progress = db.query(StudentProgress).filter(
            StudentProgress.user_id == s.id,
            StudentProgress.status == ProgressStatus.in_progress,
        ).first()
        stage_name = ""
        if progress and progress.current_stage_id:
            stage = db.get(Stage, progress.current_stage_id)
            stage_name = stage.name if stage else ""

        ws.cell(row=row, column=1, value=s.full_name)
        ws.cell(row=row, column=2, value=s.login)
        ws.cell(row=row, column=3, value=s.email)
        ws.cell(row=row, column=4, value=s.phone or "")
        ws.cell(row=row, column=5, value=s.gpa or "")
        ws.cell(row=row, column=6, value=s.ielts_score or "")
        ws.cell(row=row, column=7, value=s.sat_score or "")
        ws.cell(row=row, column=8, value=s.account_status.value)
        ws.cell(row=row, column=9, value=s.desired_specialty or "")
        ws.cell(row=row, column=10, value=s.citizenship or "")
        ws.cell(row=row, column=11, value=s.created_at.strftime("%d.%m.%Y") if s.created_at else "")

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.read()
