from sqlalchemy.orm import Session
from app.models.university import University
from app.models.user import User

# Чем больше ранг — тем сложнее поступление
DIFFICULTY_RANK = {"Легко": 1, "Средний": 2, "Сложно": 3}


def _as_list(value) -> list:
    """Нормализует JSON-поле к списку (может быть None / строкой / списком)."""
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return list(value)
    return [value]


def match_universities(db: Session, user: User) -> list[University]:
    """Подбор вузов под данные студента.

    Жёсткие фильтры применяются только если у студента заполнено
    соответствующее поле — иначе критерий не сужает выборку.
    """
    universities = (
        db.query(University)
        .filter(University.deleted_at.is_(None))
        .all()
    )

    # Предпочтения студента (нормализованные)
    country_pref = [str(c).strip().lower() for c in _as_list(user.country_preference) if c]
    # Студент заполняет desired_specialty; specialty_preference выставляет админ — учитываем оба
    specialty_pref = (user.specialty_preference or user.desired_specialty or "").strip().lower()
    pref_rank = DIFFICULTY_RANK.get(user.preferred_difficulty) if user.preferred_difficulty else None
    wants_lang_year = (user.wants_language_year or "").strip().lower() == "yes"

    result: list[University] = []

    for uni in universities:
        # 1. Страна
        if country_pref and (uni.country or "").strip().lower() not in country_pref:
            continue

        # 2. Специальность (подстрока в одной из специальностей вуза)
        if specialty_pref:
            specs = _as_list(uni.specialties)
            if specs and not any(specialty_pref in str(s).lower() for s in specs):
                continue

        # 3. Сложность: не показываем вузы сложнее, чем готов студент
        if pref_rank is not None and uni.difficulty:
            uni_rank = DIFFICULTY_RANK.get(uni.difficulty)
            if uni_rank is not None and uni_rank > pref_rank:
                continue

        # 4. Языковой год обязателен для студента
        if wants_lang_year and not uni.has_language_year:
            continue

        # 5. GPA и баллы тестов — только если у вуза заданы структурированные требования
        reqs = uni.requirements if isinstance(uni.requirements, dict) else {}
        if reqs:
            min_gpa = reqs.get("min_gpa")
            if min_gpa and user.gpa is not None and user.gpa < min_gpa:
                continue

            test_ok = True
            for score, req_key in (
                (user.ielts_score, "min_IELTS"),
                (user.toefl_score, "min_TOEFL"),
                (user.sat_score, "min_SAT"),
                (user.hsk_level, "min_HSK"),
            ):
                required = reqs.get(req_key)
                if required and score is not None and score < required:
                    test_ok = False
                    break
            if not test_ok:
                continue

        result.append(uni)

    # Сначала самые доступные по сложности, затем по рейтингу (меньше число — выше)
    result.sort(key=lambda u: (
        DIFFICULTY_RANK.get(u.difficulty, 99),
        u.rating if u.rating is not None else 9999,
    ))
    return result
