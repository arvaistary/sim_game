import type { Industry, IndustryId, WorkType } from './work-categories.types'

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

export const JOB_INDUSTRY_MAP: Record<string, IndustryId> = {
  office_employee: 'office',
  shift_worker: 'production',
  project_coordinator: 'management',
  business_analyst: 'analytics',
  team_lead: 'management',
  senior_manager: 'management',
  freelance_specialist: 'freelance',
  department_head: 'executive',
}

/**
 * @description [Work categories] - Resolves a career job id to its industry filter bucket.
 * @return { IndustryId } Industry identifier used by the work page filter.
 */
export const resolveJobIndustry = (jobId: string): IndustryId => {
  const mappedIndustry: IndustryId | undefined = JOB_INDUSTRY_MAP[jobId]

  if (mappedIndustry !== undefined) {
    return mappedIndustry
  }

  if (
    jobId === 'it_techlead'
    || jobId === 'prod_director'
    || jobId === 'med_head'
    || jobId === 'edu_professor'
    || jobId === 'retail_director'
    || jobId === 'bank_director'
  ) {
    return 'executive'
  }

  if (
    jobId.startsWith('it_')
    || jobId === 'qa_engineer'
    || jobId === 'devops'
    || jobId === 'system_admin'
    || jobId === 'med_nurse'
    || jobId.startsWith('med_doctor_')
    || jobId === 'med_head'
    || jobId.startsWith('edu_')
    || jobId.startsWith('office_')
    || jobId === 'hr_specialist'
    || jobId === 'accountant'
    || jobId === 'gov_specialist'
    || jobId === 'gov_inspector'
    || jobId === 'gov_official'
  ) {
    return 'office'
  }

  if (
    jobId.startsWith('prod_')
    || jobId.startsWith('build_')
    || jobId === 'driver_cargo'
    || jobId === 'driver_ap'
  ) {
    return 'production'
  }

  if (
    jobId === 'retail_seller'
    || jobId === 'retail_shift'
    || jobId === 'retail_manager'
    || jobId === 'retail_director'
    || jobId === 'logistics_manager'
  ) {
    return 'management'
  }

  if (
    jobId === 'data_analyst'
    || jobId === 'finance_manager'
    || jobId === 'bank_manager'
    || jobId === 'bank_analyst'
    || jobId === 'bank_director'
  ) {
    return 'analytics'
  }

  if (
    jobId.startsWith('media_')
    || jobId === 'service_cosmetologist'
    || jobId === 'service_fit'
    || jobId === 'service_realtor'
    || jobId.startsWith('cook_')
    || jobId === 'chef'
  ) {
    return 'freelance'
  }

  return 'office'
}
