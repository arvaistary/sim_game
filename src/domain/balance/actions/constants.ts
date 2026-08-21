import type { ActionCategoryDef } from '@/domain/balance/types'

export const ACTION_CATEGORIES: ActionCategoryDef[] = [
  { id: 'shop', label: 'Магазин', icon: 'cart' },
  { id: 'fun', label: 'Отдых', icon: 'gamepad' },
  { id: 'home', label: 'Дом', icon: 'home' },
  { id: 'social', label: 'Социальное', icon: 'users' },
  { id: 'education', label: 'Образование', icon: 'book' },
  { id: 'finance', label: 'Финансы', icon: 'wallet' },
  { id: 'career', label: 'Карьера', icon: 'briefcase' },
  { id: 'hobby', label: 'Хобби', icon: 'palette' },
  { id: 'health', label: 'Здоровье', icon: 'hospital' },
  { id: 'selfdev', label: 'Саморазвитие', icon: 'lightbulb-bolt' },
]
