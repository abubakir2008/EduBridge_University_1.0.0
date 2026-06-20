"""Умное сравнение специальностей студента и вуза (детерминированный алгоритм, без LLM).

Понимает морфологию русского/английского: «программист», «программирование»,
«программная инженерия» и вузовское «Компьютерные науки» / «наука о компьютерах»
относятся к одному кластеру и совпадают. Близкие, но не идентичные направления
получают частичный балл (≥0.5), несвязанные — около нуля.

Механизмы (по убыванию веса):
  1) кластеры синонимов по ОСНОВАМ слов (префиксам), устойчивые к окончаниям;
  2) совпадение по отдельным значимым словам (общая основа / опечатка) — частичный балл;
  3) fuzzy-сравнение строк целиком (difflib) — страховка от опечаток.

`best_specialty_score()` возвращает качество 0..1 — лучшее по всем парам
(желаемая специальность студента × специальность вуза).

Запуск самотеста:  python -m app.services.specialty_matcher
"""
import re
from difflib import SequenceMatcher

# Короткие токены, которые матчим ТОЛЬКО как целое слово (иначе ловят чужие слова:
# «art» в «artificial», «it» в «item» и т.п.).
EXACT_TOKENS: set[str] = {
    "it", "ит", "cs", "ai", "ии", "ml", "pr", "hr", "ux", "ui", "art", "mba", "law", "seo",
}

# Стоп-слова: служебные и слишком общие — не несут смысла специальности.
STOPWORDS: set[str] = {
    "и", "о", "об", "в", "во", "на", "по", "с", "со", "для", "или", "the", "of", "and",
    "a", "an", "in", "to", "наука", "науки", "научн", "дело", "study", "studies",
    "специальность", "направление", "профиль",
}

# Кластеры синонимов. Элемент — ОСНОВА слова (префикс) либо многословная фраза
# (тогда совпадение по всем словам как префиксам). Термин относится к кластеру,
# если любой его значимый токен начинается с одной из основ кластера.
SYNONYM_GROUPS: list[set[str]] = [
    # 0. Компьютеры / IT / разработка
    {"программ", "компьютер", "comput", "software", "информатик", "информацион",
     "разработ", "develop", "вычислит", "кодинг", "coding", "айти", "it", "ит", "cs"},
    # 1. ИИ / данные / ML
    {"искусствен", "интеллект", "artificial", "нейросет", "neural", "глубок обучен",
     "машинн обучен", "machine learning", "ml", "data", "scien", "данн",
     "анализ данн", "big data", "ии", "ai", "датасайенс"},
    # 2. Экономика / финансы
    {"эконом", "econom", "финанс", "financ", "бухгалт", "accounting",
     "банк", "bank", "аудит", "audit", "налог"},
    # 3. Менеджмент / бизнес / управление
    {"менеджмент", "manage", "бизнес", "business", "управлен", "администрир",
     "administ", "mba", "предпринимат", "entrepre"},
    # 4. Медицина / здоровье
    {"медиц", "medic", "лечебн", "врач", "health", "стоматолог", "dental",
     "фармац", "pharma", "клиническ", "clinical", "nurs", "сестринск", "хирург"},
    # 5. Инженерия / техника
    {"инженер", "engineer", "машиностро", "mechanical", "механик", "мехатрон",
     "электротехник", "electrical", "robot", "робот", "энергетик", "energy"},
    # 6. Право / юриспруденция
    {"прав", "юри", "law", "legal", "правовед"},
    # 7. Маркетинг / реклама / PR
    {"маркет", "market", "реклам", "advertis", "pr", "брендинг", "branding",
     "связи с обществен", "public relations"},
    # 8. Дизайн
    {"дизайн", "design", "графическ", "graphic", "ux", "ui"},
    # 9. Архитектура / строительство
    {"архитектур", "architect", "строительств", "градостро", "construct",
     "civil engineering"},
    # 10. Лингвистика / языки / перевод
    {"лингвист", "linguist", "перевод", "translat", "филолог", "philolog",
     "язык", "language", "interpret"},
    # 11. Международные отношения / дипломатия
    {"международн отношен", "international relations", "дипломат", "diplom",
     "геополит", "global studies", "мировая политик"},
    # 12. Туризм / гостеприимство
    {"туризм", "tourism", "гостиничн", "гостеприим", "hospitality", "hotel", "отельн"},
    # 13. Химия
    {"хими", "chemi", "chemical"},
    # 14. Биология / биотех
    {"биолог", "biolog", "биотехн", "biotech", "генетик", "genetic", "микробиолог"},
    # 15. Физика
    {"физик", "physic"},
    # 16. Математика / статистика
    {"математ", "mathemat", "math", "статистик", "statistic"},
    # 17. Педагогика / образование
    {"педагог", "pedagog", "educat", "образован", "teach", "преподаван", "методик"},
    # 18. Психология
    {"психолог", "psycholog"},
    # 19. Логистика / транспорт
    {"логистик", "logistic", "supply chain", "цепи поставок", "снабжен",
     "морск управл", "transport", "транспорт"},
    # 20. Экология / окружающая среда
    {"эколог", "ecolog", "environ", "окружающ сред", "природопольз"},
    # 21. Агро / пищевое
    {"агроном", "agricult", "сельск хозяйств", "аквакультур", "aquacult",
     "пищев", "food"},
    # 22. Журналистика / медиа / коммуникации
    {"журналист", "journal", "медиа", "media", "коммуникац", "communicat", "телевид"},
    # 23. Искусство / музыка
    {"искусств", "fine art", "изобразительн", "живопис", "скульптур", "музык", "music"},
    # 24. Текстиль / мода
    {"текстиль", "textile", "мода", "fashion", "одежд", "apparel", "костюм"},
    # 25. Социология / политология / госуправление
    {"социолог", "sociolog", "политолог", "political", "public policy",
     "государствен управл", "социальн работ", "social work"},
]

_FUZZY = 0.85       # порог похожести строк целиком (опечатки)
_MIN_TOK = 4        # значимый токен — от 4 символов (короче считаем шумом)


def _norm(s) -> str:
    return re.sub(r"\s+", " ", str(s or "").strip().lower())


def _tokens(s: str) -> list[str]:
    return re.findall(r"[a-zа-яё0-9]+", s.lower())


def _sig_tokens(s: str) -> list[str]:
    """Значимые токены: длиной от _MIN_TOK и не стоп-слова."""
    out = []
    for t in _tokens(s):
        if t in STOPWORDS:
            continue
        if len(t) >= _MIN_TOK or t in EXACT_TOKENS:
            out.append(t)
    return out


def split_specialties(text: str | None) -> list[str]:
    """Делит строку студента на несколько специальностей по разделителям."""
    if not text:
        return []
    parts = re.split(r"[,;/|\n]|\bи\b|\band\b", text.lower())
    return [p.strip() for p in parts if p.strip()]


def _kw_matches(kw: str, toks: list[str]) -> bool:
    """Совпадает ли ключевая основа кластера с токенами термина."""
    if " " in kw:  # многословная фраза — все слова как префиксы
        words = kw.split()
        return all(any(t.startswith(w) for t in toks) for w in words)
    if kw in EXACT_TOKENS:  # короткий токен — только как целое слово
        return kw in toks
    # основа: токен начинается с основы, либо (для аббревиатур) основа с токена
    return any(t.startswith(kw) or (len(t) >= _MIN_TOK and kw.startswith(t)) for t in toks)


def _groups_of(term: str) -> set[int]:
    toks = _tokens(_norm(term))
    res: set[int] = set()
    for i, group in enumerate(SYNONYM_GROUPS):
        for kw in group:
            if _kw_matches(kw, toks):
                res.add(i)
                break
    return res


def _common_prefix(a: str, b: str) -> int:
    n = 0
    for x, y in zip(a, b):
        if x != y:
            break
        n += 1
    return n


def _tok_sim(a: str, b: str) -> float:
    """Похожесть двух отдельных слов 0..1 (общая основа / опечатка)."""
    if a == b:
        return 1.0
    cp = _common_prefix(a, b)
    mn = min(len(a), len(b))
    if cp >= 5 and cp >= 0.7 * mn:      # одна основа слова (программ-ист/-ирование)
        return 0.9
    r = SequenceMatcher(None, a, b).ratio()
    if r >= _FUZZY:                      # опечатка
        return 0.8
    if cp >= 4 and cp >= 0.6 * mn:       # частично общая основа
        return 0.6
    if r >= 0.7:
        return 0.5 * r
    return 0.0


def pair_score(a: str, b: str) -> float:
    """Качество совпадения двух специальностей: 0..1."""
    a, b = _norm(a), _norm(b)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    if _groups_of(a) & _groups_of(b):                 # общий кластер синонимов
        return 0.9
    if (a in b or b in a) and min(len(a), len(b)) >= 4:  # подстрока
        return 0.82
    ta, tb = _sig_tokens(a), _sig_tokens(b)
    best_tok = 0.0
    for x in ta:
        for y in tb:
            s = _tok_sim(x, y)
            if s > best_tok:
                best_tok = s
    if best_tok >= 0.85:    # общее значимое слово / его опечатка
        return 0.7
    if best_tok >= 0.6:     # общая основа значимого слова → «хотя бы наполовину»
        return 0.6
    if best_tok >= 0.5:
        return 0.5
    if SequenceMatcher(None, a, b).ratio() >= _FUZZY:  # вся строка — опечатка
        return 0.7
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


# --------------------------------------------------------------------------- #
# Самотест: гарантирует, что ключевые сопоставления работают и не ломаются.
# --------------------------------------------------------------------------- #
def _self_test() -> None:
    # (термин студента, специальность вуза, нижняя граница ожидаемого балла)
    should_match = [
        ("программист", "Компьютерные науки", 0.5),
        ("наука о компьютерах", "Компьютерные науки", 0.5),
        ("программирование", "Программная инженерия", 0.5),
        ("айтишник", "Информационные технологии", 0.5),
        ("экономист", "Финансы", 0.5),
        ("юрист", "Право", 0.5),
        ("маркетолог", "Маркетинг", 0.5),
        ("врач", "Медицина", 0.5),
        ("инженер-механик", "Машиностроение", 0.5),
        ("переводчик", "Лингвистика", 0.5),
        ("биотехнолог", "Биология", 0.5),
        ("компьютерные науки", "Computer Science", 0.5),
        ("data scientist", "Искусственный интеллект", 0.5),
        ("психолог", "Психология", 0.9),
    ]
    # (термин, специальность, верхняя граница — должны почти НЕ совпадать)
    should_not = [
        ("повар", "Компьютерные науки", 0.3),
        ("программист", "Журналистика", 0.3),
        ("юрист", "Химия", 0.3),
        ("балет", "Финансы", 0.3),
    ]

    ok = True
    for st, sp, lo in should_match:
        sc = pair_score(st, sp)
        flag = "OK " if sc >= lo else "FAIL"
        if sc < lo:
            ok = False
        print(f"  [{flag}] '{st}' ↔ '{sp}' = {sc:.2f}  (нужно ≥ {lo})")
    for st, sp, hi in should_not:
        sc = pair_score(st, sp)
        flag = "OK " if sc <= hi else "FAIL"
        if sc > hi:
            ok = False
        print(f"  [{flag}] '{st}' ↔ '{sp}' = {sc:.2f}  (нужно ≤ {hi})")

    # Проверка сквозного подбора лучшей пары
    pool = ["Финансы", "Компьютерные науки", "Журналистика", "Право"]
    bs = best_specialty_score(["программист"], pool)
    print(f"  best('программист', {pool}) = {bs:.2f}")
    assert bs >= 0.5, "best_specialty_score сломан для программист↔CS"

    print("\nИТОГ:", "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ ✓" if ok else "ЕСТЬ ПРОВАЛЫ ✗")
    if not ok:
        raise SystemExit(1)


if __name__ == "__main__":
    _self_test()
