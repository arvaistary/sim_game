export interface ActionCategory {
  id: string
  label: string
  subtitle: string
  icon: string
}

export const ACTION_CATEGORIES: ActionCategory[] = [
  { id: 'fun', label: 'Развлечения', subtitle: 'Отдых, веселье и приятные занятия', icon: '🎭' },
  { id: 'hobby', label: 'Хобби', subtitle: 'Творческие занятия для души и развития навыков', icon: '🎨' },
  { id: 'health', label: 'Здоровье', subtitle: 'Забота о физическом и ментальном здоровье', icon: '❤️' },
  { id: 'social', label: 'Соц. жизнь', subtitle: 'Встречи, контакты и социальные связи', icon: '👥' },
]
