import type { NavItem } from '@/domain/balance/types'

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Недвижимость' },
  { id: 'shop', label: 'Магазин' },
  { id: 'actions', label: 'Действия' },
  { id: 'work', label: 'Работа' },
  { id: 'education', label: 'Обучение' },
  { id: 'skills', label: 'Навыки' },
  { id: 'finance', label: 'Финансы' },
  { id: 'activityLog', label: 'Журнал' },
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
