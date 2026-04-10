import type { StatDef, NavItem } from '@/domain/balance/types'

export const STAT_DEFS: StatDef[] = [
  { key: 'hunger', label: 'Голод', startColor: '#FF9F6B', endColor: '#FF6B6B' },
  { key: 'energy', label: 'Энергия', startColor: '#6D9DC5', endColor: '#4A7C9E' },
  { key: 'stress', label: 'Стресс', startColor: '#E87D7D', endColor: '#D14D4D' },
  { key: 'mood', label: 'Настроение', startColor: '#F4D95F', endColor: '#E8B94A' },
  { key: 'health', label: 'Здоровье', startColor: '#7ED9A0', endColor: '#4EBF7A' },
  { key: 'physical', label: 'Форма', startColor: '#A8CABA', endColor: '#6FAE91' },
]

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'Д', label: 'Дом' },
  { id: 'shop', icon: 'М', label: 'Магазин' },
  { id: 'fun', icon: 'Р', label: 'Развлеч.' },
  { id: 'education', icon: 'О', label: 'Обучение' },
  { id: 'skills', icon: 'Н', label: 'Навыки' },
  { id: 'social', icon: 'С', label: 'Соц. жизнь' },
  { id: 'finance', icon: 'Ф', label: 'Финансы' },
  { id: 'hobby', icon: 'Х', label: 'Хобби' },
  { id: 'health', icon: 'З', label: 'Здоровье' },
  { id: 'selfdev', icon: 'Р', label: 'Развитие' },
  { id: 'activityLog', icon: '📋', label: 'Журнал' },
]
