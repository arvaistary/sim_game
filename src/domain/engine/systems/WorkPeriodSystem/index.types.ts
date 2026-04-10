import type { StatChanges } from '@/domain/balance/types'

export interface WorkEventChoice {
  label?: string
  outcome?: string
  statChanges?: StatChanges
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
}
