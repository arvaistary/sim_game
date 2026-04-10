import type { ActionCategoryDef } from '@/domain/balance/types'

export const ACTION_CATEGORIES: ActionCategoryDef[] = [
  { id: 'shop', label: 'Магазин', icon: '🛒' },
  { id: 'fun', label: 'Отдых', icon: '🎮' },
  { id: 'home', label: 'Дом', icon: '🏠' },
  { id: 'social', label: 'Социальное', icon: '👥' },
  { id: 'education', label: 'Образование', icon: '📚' },
  { id: 'finance', label: 'Финансы', icon: '💰' },
  { id: 'career', label: 'Карьера', icon: '💼' },
  { id: 'hobby', label: 'Хобби', icon: '🎨' },
  { id: 'health', label: 'Здоровье', icon: '🏥' },
  { id: 'selfdev', label: 'Саморазвитие', icon: '🧠' },
]
