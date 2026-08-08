import type { ComputedRef } from 'vue'

export interface WorkSnapshot {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  salaryPerHour: number
  salaryPerDay: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
}

export interface WorkOptions {
  jobName: string
  schedule: string
  dailyHours: number
  oneDayHours: number
  fullShiftHours: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  remainingHoursCurrentWeek: number
}

export interface UseWorkShiftOptions {
  workOptions: ComputedRef<WorkOptions | null>
}
