import type { NavItem } from '@domain/balance/types'

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: 'H', label: 'Недвижимость' },
  { id: 'shop', icon: 'М', label: 'Магазин' },
  { id: 'actions', icon: 'Д', label: 'Действия' },
  { id: 'work', icon: 'Р', label: 'Работа' },
  { id: 'education', icon: 'О', label: 'Обучение' },
  { id: 'skills', icon: 'Н', label: 'Навыки' },
  { id: 'finance', icon: 'Ф', label: 'Финансы' },
  { id: 'activityLog', icon: '📋', label: 'Журнал' },
]

export const ROUTE_MAP: Record<string, string> = {
  home: '/game/home',
  shop: '/game/shop',
  actions: '/game/actions',
  work: '/game/work',
  education: '/game/education',
  skills: '/game/skills',
  finance: '/game/finance',
  activityLog: '/game/activity',
}
