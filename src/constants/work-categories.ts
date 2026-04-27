import type { WorkType, Industry } from './work-categories.types'

export const WORK_TYPES: WorkType[] = [
  {
    id: 'full-time',
    label: 'Полная ставка',
    subtitle: 'Работа на полный рабочий день (5/2)',
    icon: '🏢',
    scheduleFilter: ['5/2'],
  },
  {
    id: 'part-time',
    label: 'Частичная занятость',
    subtitle: 'Сменная работа и свободный график',
    icon: '⏰',
    scheduleFilter: ['2/2', 'Свободный'],
  },
]

export const INDUSTRIES: Industry[] = [
  { id: 'all', label: 'Все отрасли', icon: '📋' },
  { id: 'office', label: 'Офис', icon: '🏢' },
  { id: 'production', label: 'Производство', icon: '🏭' },
  { id: 'management', label: 'Управление', icon: '👔' },
  { id: 'analytics', label: 'Аналитика', icon: '📊' },
  { id: 'freelance', label: 'Фриланс', icon: '💻' },
  { id: 'executive', label: 'Руководство', icon: '🎯' },
]

export const JOB_INDUSTRY_MAP: Record<string, string> = {
  office_employee: 'office',
  shift_worker: 'production',
  project_coordinator: 'management',
  business_analyst: 'analytics',
  team_lead: 'management',
  senior_manager: 'management',
  freelance_specialist: 'freelance',
  department_head: 'executive',
}
