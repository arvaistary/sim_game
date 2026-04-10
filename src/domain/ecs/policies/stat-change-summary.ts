import type { StatChanges } from '@/domain/balance/types'

const LABELS: Record<string, string> = {
  hunger: 'Голод',
  energy: 'Энергия',
  stress: 'Стресс',
  mood: 'Настроение',
  health: 'Здоровье',
  physical: 'Форма',
}

export function summarizeStatChanges(statChanges: StatChanges = {}): string {
  const items = Object.entries(statChanges)
    .filter(([, value]) => typeof value === 'number' && value !== 0)
    .map(([key, value]) => {
      const sign = value > 0 ? '+' : ''
      const label = LABELS[key] ?? key
      return `• ${label}: ${sign}${value}`
    })
  return items.join('\n')
}
