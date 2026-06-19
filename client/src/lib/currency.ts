// Валюта по стране вуза/студента. Стоимость хранится в валюте страны,
// поэтому показываем правильный символ (¥ для Китая, € для Италии и т.д.),
// а не повсеместный «$».

const COUNTRY_CURRENCY: Record<string, string> = {
  china: 'CNY', китай: 'CNY',
  italy: 'EUR', италия: 'EUR',
  germany: 'EUR', германия: 'EUR',
  france: 'EUR', франция: 'EUR',
  spain: 'EUR', испания: 'EUR',
  austria: 'EUR', австрия: 'EUR',
  netherlands: 'EUR', нидерланды: 'EUR',
  turkey: 'TRY', 'türkiye': 'TRY', турция: 'TRY',
  usa: 'USD', 'united states': 'USD', сша: 'USD', америка: 'USD',
  uk: 'GBP', 'united kingdom': 'GBP', великобритания: 'GBP', англия: 'GBP',
  russia: 'RUB', россия: 'RUB',
  kazakhstan: 'KZT', казахстан: 'KZT',
}

const SYMBOL: Record<string, string> = {
  CNY: '¥', EUR: '€', GBP: '£', USD: '$', TRY: '₺', RUB: '₽', KZT: '₸',
}

export function currencyForCountry(country?: string | null): string {
  return COUNTRY_CURRENCY[(country ?? '').trim().toLowerCase()] ?? 'USD'
}

export function currencySymbol(country?: string | null): string {
  return SYMBOL[currencyForCountry(country)] ?? '$'
}

/** «¥28 000» — символ валюты страны + сумма с разделителями. */
export function formatCost(amount?: number | null, country?: string | null): string {
  if (amount == null) return ''
  return `${currencySymbol(country)}${amount.toLocaleString('ru-RU')}`
}
