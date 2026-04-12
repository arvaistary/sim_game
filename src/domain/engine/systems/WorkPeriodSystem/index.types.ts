import type { StatChanges } from '@/domain/balance/types'

export interface WorkEventChoice {
  label?: string
  outcome?: string
  statChanges?: StatChanges
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
}

export interface WorkShiftSummaryParams {
  workHours: number
  accruedSalary: number
  payoutSalary: number
  pendingSalaryWeek: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  statChanges: Record<string, number>
  WorkEventChoice: WorkEventChoice | null
  careerUpdateSummary: string
}
