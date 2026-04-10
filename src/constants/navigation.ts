import type { NavItem } from '@/domain/balance/types'

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

export const ROUTE_MAP: Record<string, string> = {
  home: '/game/home',
  shop: '/game/shop',
  fun: '/game/fun',
  education: '/game/education',
  skills: '/game/skills',
  social: '/game/social',
  finance: '/game/finance',
  hobby: '/game/hobby',
  health: '/game/health',
  selfdev: '/game/selfdev',
  activityLog: '/game/activity',
}
