import type { StatChanges } from '@/domain/balance/types'
import { STAT_LABELS_RU } from '@/constants/metric-labels'

export function summarizeStatChanges(statChanges: StatChanges = {}): string {
  const items = Object.entries(statChanges)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => {
      const sign = value > 0 ? '+' : ''
      const label = STAT_LABELS_RU[key] ?? key
      return `• ${label}: ${sign}${value}`
    })
  return items.join('\n')
}
