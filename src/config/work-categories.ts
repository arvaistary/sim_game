import type { Industry, WorkType } from './work-categories.types'

export type { Industry, WorkType } from './work-categories.types'

export const WORK_TYPES: WorkType[] = [
  {
    id: 'full-time',
    label: 'Полная ставка',
    subtitle: 'Работа на полный рабочий день (5/2)',
    icon: 'buildings-2',
    scheduleFilter: ['5/2'],
  },
  {
    id: 'part-time',
    label: 'Частичная занятость',
    subtitle: 'Сменная работа и свободный график',
    icon: 'clock-circle',
    scheduleFilter: ['2/2', 'Свободный'],
  },
]

export const INDUSTRIES: Industry[] = [
  { id: 'all', label: 'Все отрасли', icon: 'chart-square' },
  { id: 'office', label: 'Офис', icon: 'buildings-2' },
  { id: 'production', label: 'Производство', icon: 'buildings' },
  { id: 'management', label: 'Управление', icon: 'case-round' },
  { id: 'analytics', label: 'Аналитика', icon: 'chart-2' },
  { id: 'freelance', label: 'Фриланс', icon: 'laptop' },
  { id: 'executive', label: 'Руководство', icon: 'target' },
]

export const JOB_INDUSTRY_MAP: Record<string, string> = {
  it_junior: 'analytics',
  it_middle: 'analytics',
  it_senior: 'analytics',
  it_techlead: 'management',
  qa_engineer: 'analytics',
  devops: 'analytics',
  system_admin: 'analytics',
  data_analyst: 'analytics',
  office_specialist: 'office',
  hr_specialist: 'office',
  accountant: 'office',
  finance_manager: 'management',
  retail_seller: 'office',
  retail_shift: 'production',
  retail_manager: 'management',
  retail_director: 'executive',
  media_copywriter: 'freelance',
  media_designer: 'freelance',
  media_photographer: 'freelance',
  media_content: 'freelance',
  cook_line: 'production',
  cook_senior: 'production',
  chef: 'management',
  service_fit: 'freelance',
  service_cosmetologist: 'freelance',
  service_realtor: 'office',
  office_employee: 'office',
  shift_worker: 'production',
  project_coordinator: 'management',
  business_analyst: 'analytics',
  team_lead: 'management',
  senior_manager: 'management',
  freelance_specialist: 'freelance',
  department_head: 'executive',
}

export const ADJACENT_INDUSTRIES: Record<string, readonly string[]> = {
  analytics: ['office', 'freelance', 'management'],
  office: ['analytics', 'management', 'freelance'],
  production: ['management', 'office'],
  management: ['office', 'analytics', 'executive'],
  freelance: ['office', 'analytics'],
  executive: ['management', 'office'],
}
