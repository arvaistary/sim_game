import { STAT_LABELS_RU, METRIC_LABELS } from '@/constants/metric-labels'

export function resolveActionLogDescription(input: {
  metadata?: {
    statChanges?: Record<string, number>
    moneyDelta?: number
    hoursSpent?: number
  }
  description?: string
}): string {
  const allLabels = { ...STAT_LABELS_RU, ...METRIC_LABELS }
  const stats = input.metadata?.statChanges ?? {}
  const statsText = Object.entries(stats)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => {
      const label = allLabels[key] ?? key
      return `${label} ${value > 0 ? '+' : ''}${value}`
    })
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
