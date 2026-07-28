export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatEffect(effect: string): string {
  const raw = (effect || '').trim()
  if (!raw) return ''
  if (raw.includes('•')) return raw
  return raw
}

function pluralize(value: number, one: string, few: string, many: string): string {
  const mod10 = value % 10
  const mod100 = value % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export function formatGameDays(days: number): string {
  const safeDays = Math.max(0, Math.floor(days))
  const years = Math.floor(safeDays / 365)
  const remainingDays = safeDays % 365

  if (years === 0) return `${safeDays} ${pluralize(safeDays, 'день', 'дня', 'дней')}`

  const result = `${years} ${pluralize(years, 'год', 'года', 'лет')}`
  return remainingDays === 0
    ? result
    : `${result}, ${remainingDays} ${pluralize(remainingDays, 'день', 'дня', 'дней')}`
}
