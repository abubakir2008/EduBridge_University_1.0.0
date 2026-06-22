from dataclasses import dataclass, field
from datetime import date
from sqlalchemy.orm import Session
from app.models.university import University
from app.models.user import User
from app.services.requirements_parser import parse_requirements
from app.services.specialty_matcher import split_specialties, best_specialty_score
from app.services.currency import currency_for_country, to_usd, DEFAULT_BUDGET_CURRENCY

# Чем больше ранг — тем сложнее поступление
DIFFICULTY_RANK = {"Легко": 1, "Средний": 2, "Сложно": 3}

# Веса критериев (максимальный вклад в очки). В знаменатель идут только активные.
W_SPECIALTY = 26
W_COUNTRY = 12
W_DIFFICULTY = 16
W_PROGRAM_LEVEL = 8
W_GPA = 10
W_TESTS = 16          # делится между актуальными тестами студента
W_LANG_YEAR = 6
W_BUDGET = 8
W_AGE = 4
W_PRESTIGE = 10       # учитывается всегда


@dataclass
class MatchResult:
    university: University
    score: int                          # 0..100
    tier: str                           # 'gold' | 'silver' | 'bronze'
    reasons: list[str] = field(default_factory=list)   # что совпало (плюсы)
    gaps: list[str] = field(default_factory=list)      # чего не хватает (минусы)


def _as_list(value) -> list:
    if value is None:
        return []
    if isinstance(value, (list, tuple)):
        return list(value)
    return [value]


def _age(dob) -> int | None:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _offers_level(uni: University, level: str) -> bool:
    if level == "bachelor":
        return bool(_as_list(uni.programs_bachelor_chinese) or _as_list(uni.programs_bachelor_english))
    if level == "master":
        return bool(_as_list(uni.programs_masters_chinese) or _as_list(uni.programs_masters_english))
    if level == "language":
        return bool(uni.has_language_year)
    return True


def _score_test(student, required, label, weight, reasons, gaps) -> tuple[float, float]:
    """Возвращает (набрано, максимум) по одному тесту с частичным кредитом."""
    if not required or student is None:
        return 0.0, 0.0
    if student >= required:
        reasons.append(f"{label} проходит ({_fmt(student)} ≥ {_fmt(required)})")
        return weight, weight
    if student >= required * 0.9:
        gaps.append(f"{label} чуть ниже (нужно {_fmt(required)}, у вас {_fmt(student)})")
        return weight * 0.6, weight
    if student >= required * 0.8:
        return weight * 0.3, weight
    gaps.append(f"{label}: нужно {_fmt(required)}, у вас {_fmt(student)}")
    return 0.0, weight


def _fmt(v) -> str:
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v)


def match_universities(db: Session, user: User) -> list[MatchResult]:
    """Многокритериальный подбор вузов под данные студента.

    Считаем взвешенный процент совпадения по ~10 критериям с ЧАСТИЧНЫМИ баллами,
    парся реальные требования из текста `min_requirements`. Ничего не отсекаем
    (кроме страны, если она явно выбрана) — слабые места лишь снижают очки, поэтому
    студент видит максимум вариантов, разбитых на тиры gold/silver/bronze, и понимает
    «что подошло» и «чего не хватает».
    """
    universities = (
        db.query(University)
        .filter(University.deleted_at.is_(None))
        .all()
    )

    country_pref = [str(c).strip().lower() for c in _as_list(user.country_preference) if c]
    # Несколько желаемых специальностей (строка делится по разделителям)
    student_specs = split_specialties(user.specialty_preference or user.desired_specialty or "")
    pref_rank = DIFFICULTY_RANK.get(user.preferred_difficulty) if user.preferred_difficulty else None
    wants_lang_year = (user.wants_language_year or "").strip().lower() == "yes"
    level = (user.program_level or "").strip().lower()
    age = _age(user.date_of_birth)

    # Бюджет студента приводим к USD. Валюта бюджета = валюта первой желаемой страны
    # (профиль подписывает поле валютой страны), иначе — юани по умолчанию.
    budget_currency = currency_for_country(country_pref[0]) if country_pref else DEFAULT_BUDGET_CURRENCY
    budget_usd = to_usd(user.max_budget_rmb, budget_currency) if user.max_budget_rmb else None

    scored: list[MatchResult] = []

    for uni in universities:
        # Жёсткий фильтр: страна (только если выбрана)
        if country_pref and (uni.country or "").strip().lower() not in country_pref:
            continue

        score = 0.0
        total = 0.0
        reasons: list[str] = []
        gaps: list[str] = []

        # 1. Специальность: синонимы + несколько интересов + фаззи (0..1)
        if student_specs:
            total += W_SPECIALTY
            quality = best_specialty_score(student_specs, _as_list(uni.specialties))
            score += W_SPECIALTY * quality
            if quality >= 0.95:
                reasons.append("Ваша специальность")
            elif quality >= 0.7:
                reasons.append("Близкая специальность")
            else:
                gaps.append("Нет вашей специальности")

        # 2. Страна
        if country_pref:
            total += W_COUNTRY
            if (uni.country or "").strip().lower() in country_pref:
                score += W_COUNTRY
                reasons.append("Желаемая страна")

        # 3. Сложность (комфорт / амбиция)
        if pref_rank is not None and uni.difficulty:
            uni_rank = DIFFICULTY_RANK.get(uni.difficulty)
            if uni_rank is not None:
                total += W_DIFFICULTY
                if uni_rank < pref_rank:
                    score += W_DIFFICULTY
                    reasons.append("Поступить проще вашего уровня")
                elif uni_rank == pref_rank:
                    score += W_DIFFICULTY * 0.9
                    reasons.append("Подходит по сложности")
                elif uni_rank == pref_rank + 1:
                    score += W_DIFFICULTY * 0.4
                    reasons.append("Амбициозный вариант")
                else:
                    gaps.append("Заметно сложнее вашего уровня")

        # 4. Уровень программы (бакалавриат / магистратура / языковой год)
        if level:
            total += W_PROGRAM_LEVEL
            if _offers_level(uni, level):
                score += W_PROGRAM_LEVEL
            else:
                label = {"bachelor": "бакалавриата", "master": "магистратуры", "language": "языкового года"}.get(level, level)
                gaps.append(f"Нет программ {label}")

        # Парсим требования (текст + структурированный JSON)
        reqs = parse_requirements(uni.min_requirements, uni.requirements if isinstance(uni.requirements, dict) else None)

        # 5. GPA
        if reqs.min_gpa and user.gpa is not None:
            total += W_GPA
            if user.gpa >= reqs.min_gpa:
                score += W_GPA
                reasons.append("Проходите по GPA")
            elif user.gpa >= reqs.min_gpa - 0.3:
                score += W_GPA * 0.5
                gaps.append(f"GPA чуть ниже (нужно {_fmt(reqs.min_gpa)})")
            else:
                gaps.append(f"GPA ниже минимума (нужно {_fmt(reqs.min_gpa)})")

        # 6. Языковые/проф. тесты — каждый сверяется со СВОИМ порогом
        test_specs = [
            (user.ielts_score, reqs.min_ielts, "IELTS"),
            (user.toefl_score, reqs.min_toefl, "TOEFL"),
            (user.sat_score, reqs.min_sat, "SAT"),
            (user.hsk_level, reqs.min_hsk, "HSK"),
        ]
        active = [(s, r, lbl) for s, r, lbl in test_specs if r and s is not None]
        if active:
            per = W_TESTS / len(active)
            for s, r, lbl in active:
                got, mx = _score_test(s, r, lbl, per, reasons, gaps)
                score += got
                total += mx

        # 7. Языковой год
        if wants_lang_year:
            total += W_LANG_YEAR
            if uni.has_language_year:
                score += W_LANG_YEAR
                reasons.append("Есть языковой год")
            else:
                gaps.append("Нет языкового года")

        # 8. Бюджет: обе суммы → USD (цена в валюте страны вуза, бюджет — студента)
        if budget_usd and uni.cost:
            total += W_BUDGET
            cost_usd = to_usd(uni.cost, currency_for_country(uni.country))
            if cost_usd <= budget_usd:
                score += W_BUDGET
                reasons.append("В рамках бюджета")
            elif cost_usd <= budget_usd * 1.15:
                score += W_BUDGET * 0.5
                gaps.append("Немного дороже бюджета")
            else:
                gaps.append("Дороже вашего бюджета")

        # 9. Возраст
        if reqs.max_age and age is not None:
            total += W_AGE
            if age <= reqs.max_age:
                score += W_AGE
            elif age <= reqs.max_age + 2:
                score += W_AGE * 0.5
                gaps.append(f"Возраст выше обычного (до {reqs.max_age})")
            else:
                gaps.append(f"Возраст выше требуемого (до {reqs.max_age})")

        # 10. Престиж/рейтинг (всегда; меньше номер = выше место)
        total += W_PRESTIGE
        if uni.rating:
            score += max(0.0, W_PRESTIGE - (uni.rating - 1) * 0.3)
        else:
            score += W_PRESTIGE * 0.5

        pct = round(score / total * 100) if total > 0 else 50
        scored.append(MatchResult(
            university=uni, score=pct, tier="bronze",
            reasons=reasons[:4], gaps=gaps[:3],
        ))

    # Сортировка: по очкам, при равенстве — по рейтингу
    scored.sort(key=lambda r: (-r.score, r.university.rating if r.university.rating is not None else 9999))

    for r in scored:
        if r.score >= 75:
            r.tier = "gold"
        elif r.score >= 50:
            r.tier = "silver"
        else:
            r.tier = "bronze"

    # Гарантируем хотя бы один «золотой» — но только если лучший вариант реально
    # годный (>= silver). Иначе слабый матч (напр. 30%) ложно подавался бы как
    # «отличный выбор», вводя студента в заблуждение.
    if scored and scored[0].score >= 50 and scored[0].tier != "gold":
        scored[0].tier = "gold"

    return scored
