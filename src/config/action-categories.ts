import type { GameIconName } from '@/constants/game-icons.types'

export interface ActionCategory {
  id: string
  label: string
  subtitle: string
  icon: GameIconName
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'fun', label: 'Развлечения', subtitle: 'Отдых, веселье и приятные занятия', icon: 'masks' },
  { id: 'hobby', label: 'Хобби', subtitle: 'Творческие занятия для души и развития навыков', icon: 'palette' },
  { id: 'health', label: 'Здоровье', subtitle: 'Забота о физическом и ментальном здоровье', icon: 'heart' },
  { id: 'social', label: 'Соц. жизнь', subtitle: 'Встречи, контакты и социальные связи', icon: 'users' },
]
