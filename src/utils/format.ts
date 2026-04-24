export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

export function formatEffect(effect: string): string {
  const raw = (effect || '').trim()
  if (!raw) return ''

  if (raw.includes('•')) return raw

  return raw
}
