import type { CareerJob } from '@/domain/balance/types'

export interface CareerTrackEntry extends CareerJob {
  current: boolean
  unlocked: boolean
  missingProfessionalism: number
  educationRequiredLabel: string
  effectiveSalaryPerHour: number
  effectiveSalaryPerDay: number
}

export interface ChangeCareerResult {
  success: boolean
  reason?: string
  message?: string
}
