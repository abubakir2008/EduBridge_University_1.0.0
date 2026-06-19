"""Парсер требований вуза.

Админы вводят требования свободным текстом в поле `min_requirements`, например:
    "Аттестат. IELTS 5.5–6.0. HSK 4–5 для китайских программ. Возраст обычно до 25 лет."

Этот модуль вытаскивает оттуда числовые пороги (IELTS/TOEFL/HSK/GPA/SAT/возраст),
чтобы подбор мог реально сравнивать их с данными студента. Структурированное поле
`requirements` (JSON), если оно есть, имеет приоритет над распарсенным текстом.
"""
import re
from dataclasses import dataclass
from typing import Optional

# Число с десятичной точкой/запятой: 5, 5.5, 6,0
_NUM = r"(\d+(?:[.,]\d+)?)"

# Допустимый «зазор» между ключевым словом и числом: только пробелы/пунктуация и
# слова-связки (от, не ниже, минимум, балл…). Чужие ключевые слова (ielts/toefl/…)
# сюда НЕ входят — иначе «GPA. IELTS 6.0» ошибочно дал бы GPA=6.0.
_FILLER = r"(?:[\s:.,;\-–—/()]|от|не|ниже|менее|min|минимум|балл\w*)*"


@dataclass
class ParsedRequirements:
    min_gpa: Optional[float] = None
    min_ielts: Optional[float] = None
    min_toefl: Optional[int] = None
    min_hsk: Optional[int] = None
    min_sat: Optional[int] = None
    max_age: Optional[int] = None


def _num_after(text: str, keyword: str) -> Optional[float]:
    """Число сразу после ключевого слова (через пробелы/связки, без чужих слов).

    Для диапазонов («IELTS 5.5–6.0») берём НИЖНЮЮ границу — это и есть минимум.
    """
    m = re.search(keyword + _FILLER + _NUM, text)
    if not m:
        return None
    try:
        return float(m.group(1).replace(",", "."))
    except ValueError:
        return None


def parse_requirements(min_requirements: Optional[str], structured: Optional[dict]) -> ParsedRequirements:
    text = (min_requirements or "").lower()
    res = ParsedRequirements()

    if text:
        res.min_ielts = _num_after(text, r"ielts")
        toefl = _num_after(text, r"toefl")
        res.min_toefl = int(toefl) if toefl is not None else None
        hsk = _num_after(text, r"hsk")
        res.min_hsk = int(hsk) if hsk is not None else None
        sat = _num_after(text, r"sat")
        res.min_sat = int(sat) if sat is not None else None

        # GPA / средний балл — только если рядом есть число
        res.min_gpa = _num_after(text, r"gpa") or _num_after(text, r"средн\w*\s*балл")

        # Возраст: «до 25 лет», «не старше 25», «возраст … 25»
        age = None
        m = re.search(r"(?:до|не\s+старше|младше)\s*(\d{2})\s*(?:лет|год)", text)
        if m:
            age = int(m.group(1))
        elif "возраст" in text:
            a = _num_after(text, r"возраст")
            age = int(a) if a is not None else None
        res.max_age = age

    # Структурированный JSON имеет приоритет (если задан админом явно)
    if isinstance(structured, dict) and structured:
        def _f(key):
            v = structured.get(key)
            return v if isinstance(v, (int, float)) else None
        res.min_gpa = _f("min_gpa") if _f("min_gpa") is not None else res.min_gpa
        res.min_ielts = _f("min_IELTS") if _f("min_IELTS") is not None else res.min_ielts
        res.min_toefl = _f("min_TOEFL") if _f("min_TOEFL") is not None else res.min_toefl
        res.min_hsk = _f("min_HSK") if _f("min_HSK") is not None else res.min_hsk
        res.min_sat = _f("min_SAT") if _f("min_SAT") is not None else res.min_sat
        res.max_age = _f("max_age") if _f("max_age") is not None else res.max_age

    return res
