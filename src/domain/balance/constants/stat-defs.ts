import type { StatDef } from '@/domain/balance/types'

export const STAT_DEFS: StatDef[] = [
  { key: 'hunger', label: 'Голод', startColor: '#FF9F6B', endColor: '#FF6B6B' },
  { key: 'energy', label: 'Энергия', startColor: '#6D9DC5', endColor: '#4A7C9E' },
  { key: 'stress', label: 'Стресс', startColor: '#E87D7D', endColor: '#D14D4D' },
  { key: 'mood', label: 'Настроение', startColor: '#F4D95F', endColor: '#E8B94A' },
  { key: 'health', label: 'Здоровье', startColor: '#7ED9A0', endColor: '#4EBF7A' },
  { key: 'physical', label: 'Форма', startColor: '#A8CABA', endColor: '#6FAE91' },
]
