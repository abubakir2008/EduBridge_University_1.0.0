"""Умное сравнение специальностей студента и вуза.

Объединяет три механизма:
  1) словарь синонимов (CS ↔ Информатика ↔ Программирование, AI ↔ ИИ ↔ ML…);
  2) несколько желаемых специальностей студента (строка делится по разделителям);
  3) фаззи-сравнение (устойчивость к опечаткам) через difflib.

`best_specialty_score()` возвращает качество совпадения 0..1 — лучшее по всем парам
(желаемая специальность × специальность вуза).
"""
import re
from difflib import SequenceMatcher

# Группы синонимов (нижний регистр). Термин принадлежит группе, если длинная фраза
# входит подстрокой, либо короткая (<=3 симв.) совпадает как отдельное слово.
SYNONYM_GROUPS: list[set[str]] = [
    {"компьютерные науки", "информатика", "программирование", "computer science",
     "cs", "software", "разработка", "информационные технологии", "it", "ит"},
    {"искусственный интеллект", "ии", "artificial intelligence", "ai",
     "машинное обучение", "machine learning", "ml", "нейросети",
     "data science", "наука о данных", "анализ данных", "big data"},
    {"экономика", "economics", "финансы", "finance", "бухгалтерия",
     "accounting", "банковское дело"},
    {"менеджмент", "management", "бизнес", "business", "управление",
     "mba", "администрирование"},
    {"медицина", "medicine", "лечебное дело", "врач", "медицинск", "health"},
    {"инженерия", "engineering", "инженер", "машиностроение", "mechanical"},
    {"право", "юриспруденция", "law", "legal", "юрист"},
    {"маркетинг", "marketing", "реклама", "pr", "связи с общественностью"},
    {"дизайн", "design", "графическ"},
    {"архитектура", "architecture"},
    {"лингвистика", "linguistics", "перевод", "translation", "филология",
     "языки", "languages"},
    {"международные отношения", "international relations", "дипломатия"},
    {"туризм", "tourism", "гостиничное дело", "hospitality"},
    {"химия", "chemistry", "химическ", "chemical"},
    {"биология", "biology", "биотехнолог", "biotech"},
    {"физика", "physics"},
    {"математика", "mathematics", "math"},
    {"педагогика", "education", "образование", "teaching", "преподавание"},
    {"психология", "psychology"},
    {"логистика", "logistics", "supply chain", "цепи поставок", "морское управление"},
    {"экология", "ecology", "environmental", "окружающая среда"},
    {"агрономия", "сельское хозяйство", "agriculture", "аквакультура",
     "пищевая наука", "food science", "пищев"},
    {"журналистика", "journalism", "медиа", "media"},
    {"искусство", "fine arts", "изобразительное"},
    {"текстиль", "textile", "мода", "fashion", "одежд"},
]

_SHORT = 3          # синонимы такой длины и короче матчим как отдельное слово
_FUZZY = 0.85       # порог похожести для опечаток


def _norm(s) -> str:
    return re.sub(r"\s+", " ", str(s or "").strip().lower())


def _tokens(s: str) -> set[str]:
    return set(re.findall(r"[a-zа-яё0-9]+", s.lower()))


def split_specialties(text: str | None) -> list[str]:
    """Делит строку студента на несколько специальностей по разделителям."""
    if not text:
        return []
    parts = re.split(r"[,;/|]|\bи\b|\band\b", text.lower())
    return [p.strip() for p in parts if p.strip()]


def _groups_of(term: str) -> set[int]:
    term = _norm(term)
    toks = _tokens(term)
    res: set[int] = set()
    for i, group in enumerate(SYNONYM_GROUPS):
        for phrase in group:
            if len(phrase) <= _SHORT:
                if phrase in toks:
                    res.add(i)
                    break
            elif phrase in term:
                res.add(i)
                break
    return res


def pair_score(a: str, b: str) -> float:
    """Качество совпадения двух специальностей: 0..1."""
    a, b = _norm(a), _norm(b)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if _groups_of(a) & _groups_of(b):      # общий синоним-кластер
        return 0.9
    if a in b or b in a:                    # подстрока
        return 0.8
    if SequenceMatcher(None, a, b).ratio() >= _FUZZY:   # опечатка
        return 0.75
    return 0.0


def best_specialty_score(student_terms: list[str], uni_specs: list) -> float:
    """Лучшее совпадение среди всех пар (желаемая × специальность вуза)."""
    best = 0.0
    for st in student_terms:
        for sp in uni_specs:
            best = max(best, pair_score(st, str(sp)))
            if best >= 1.0:
                return best
    return best
