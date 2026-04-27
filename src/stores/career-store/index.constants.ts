import type { JobSnapshot } from './index.types'

export const UNEMPLOYED: JobSnapshot = {
  id: '',
  name: 'Безработный',
  schedule: '—',
  employed: false,
  level: 0,
  salaryPerHour: 0,
  salaryPerDay: 0,
  salaryPerWeek: 0,
  requiredHoursPerWeek: 0,
  workedHoursCurrentWeek: 0,
  pendingSalaryWeek: 0,
  totalWorkedHours: 0,
  daysAtWork: 0,
}