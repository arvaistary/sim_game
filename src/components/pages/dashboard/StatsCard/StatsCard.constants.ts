import type { StatDef } from './StatsCard.types'
export const INVERTED_STATS = new Set(['hunger', 'stress'])

export const statDefs: StatDef[] = [
  {
    key: 'energy',
    label: 'Энергия',
    endColor: 'var(--color-status-success)'
  },
  {
    key: 'health',
    label: 'Здоровье',
    endColor: 'var(--color-status-success)'
  },
  {
    key: 'hunger',
    label: 'Голод',
    endColor: 'var(--color-status-warning)'
  },
  {
    key: 'stress',
    label: 'Стресс',
    endColor: 'var(--color-status-danger)'
  },
  {
    key: 'mood',
    label: 'Настроение',
    endColor: 'var(--color-status-success)'
  },
  {
    key: 'physical',
    label: 'Физическая форма',
    endColor: 'var(--color-status-info)'
  },
]