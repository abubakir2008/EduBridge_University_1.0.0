"""Валютная нормализация для подбора.

Принцип: и стоимость вуза, и бюджет студента хранятся в ВАЛЮТЕ СТРАНЫ
(Китай → CNY, Италия → EUR, Турция → TRY, США → USD…). Чтобы корректно
сравнивать «юаневый» бюджет студента с «евровой» ценой вуза, обе суммы
приводятся к общей базе — USD.

Курсы — фолбэк-константы (приблизительные). При необходимости их можно
обновлять из внешнего FX-API; здесь намеренно оставлены оффлайн-значения,
чтобы подбор работал без внешних зависимостей.
"""

# Страна (в любом регистре, рус/англ) → ISO-код валюты
COUNTRY_CURRENCY = {
    "china": "CNY", "китай": "CNY",
    "italy": "EUR", "италия": "EUR",
    "germany": "EUR", "германия": "EUR",
    "france": "EUR", "франция": "EUR",
    "spain": "EUR", "испания": "EUR",
    "austria": "EUR", "австрия": "EUR",
    "netherlands": "EUR", "нидерланды": "EUR",
    "czech republic": "EUR", "czechia": "EUR", "чехия": "EUR",
    "poland": "EUR", "польша": "EUR",
    "belgium": "EUR", "бельгия": "EUR",
    "turkey": "TRY", "türkiye": "TRY", "турция": "TRY",
    "usa": "USD", "united states": "USD", "сша": "USD", "америка": "USD",
    "uk": "GBP", "united kingdom": "GBP", "великобритания": "GBP", "англия": "GBP",
    "russia": "RUB", "россия": "RUB",
    "kazakhstan": "KZT", "казахстан": "KZT",
}

# 1 единица валюты = X USD (приблизительно)
RATES_TO_USD = {
    "USD": 1.0,
    "CNY": 0.14,
    "EUR": 1.08,
    "GBP": 1.27,
    "TRY": 0.030,
    "RUB": 0.011,
    "KZT": 0.0021,
}

DEFAULT_CURRENCY = "USD"
# Поле бюджета студента исторически называется max_budget_rmb → дефолт юани
DEFAULT_BUDGET_CURRENCY = "CNY"


def currency_for_country(country: str | None) -> str:
    return COUNTRY_CURRENCY.get((country or "").strip().lower(), DEFAULT_CURRENCY)


def to_usd(amount, currency: str) -> float | None:
    """Переводит сумму в USD по фолбэк-курсу."""
    if amount is None:
        return None
    return float(amount) * RATES_TO_USD.get(currency, 1.0)
