import random
import string
import re

try:
    from transliterate import translit
    _HAS_TRANSLIT = True
except ImportError:
    _HAS_TRANSLIT = False

_CYRILLIC_MAP = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh',
    'з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o',
    'п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts',
    'ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
}


def _transliterate(name: str) -> str:
    if _HAS_TRANSLIT:
        try:
            return translit(name, "ru", reversed=True)
        except Exception:
            pass
    result = ""
    for ch in name.lower():
        result += _CYRILLIC_MAP.get(ch, ch)
    return result


def generate_login(full_name: str, phone: str) -> str:
    first_name = full_name.strip().split()[0]
    latin = _transliterate(first_name)
    latin = re.sub(r"[^a-z]", "", latin.lower())

    digits = re.sub(r"\D", "", phone)
    if len(digits) >= 4:
        sample = random.sample(list(digits), 4)
    else:
        sample = [str(random.randint(0, 9)) for _ in range(4)]

    return latin + "".join(sample)


def generate_password(length: int = 10) -> str:
    alphabet = string.ascii_letters + string.digits
    while True:
        pwd = "".join(random.choices(alphabet, k=length))
        has_letter = any(c.isalpha() for c in pwd)
        has_digit = any(c.isdigit() for c in pwd)
        if has_letter and has_digit:
            return pwd
