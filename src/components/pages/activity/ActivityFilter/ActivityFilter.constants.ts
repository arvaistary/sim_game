import type { ActivityFilterItem } from './ActivityFilter.types'

export const ACTIVITY_FILTERS: ActivityFilterItem[] = [
  { label: 'Все', type: null },
  { label: 'Действия', type: 'action' },
  { label: 'События', type: 'event' },
  { label: 'Финансы', type: 'finance' },
  { label: 'Карьера', type: 'career' },
  { label: 'Обучение', type: 'education' },
  { label: 'Навыки', type: 'skill_change' },
  { label: 'Время', type: 'time' },
]
