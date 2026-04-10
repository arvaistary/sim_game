export function resolveActionLogDescription(input: {
  metadata?: {
    statChanges?: Record<string, number>
    moneyDelta?: number
    hoursSpent?: number
  }
  description?: string
}): string {
  const stats = input.metadata?.statChanges ?? {}
  const statsText = Object.entries(stats)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => `${key} ${value > 0 ? '+' : ''}${value}`)
    .join(', ')

  const money = input.metadata?.moneyDelta
  const time = input.metadata?.hoursSpent
  const parts = [
    input.description ?? '',
    typeof money === 'number' && money !== 0 ? `деньги ${money > 0 ? '+' : ''}${money}` : '',
    typeof time === 'number' && time > 0 ? `время ${time}ч` : '',
    statsText,
  ].filter(Boolean)

  return parts.join(' • ')
}
