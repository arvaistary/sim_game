import type { StatChanges } from '@/domain/balance/types'

export interface WorkRandomEventChoice {
  label: string
  outcome: string
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
  statChanges: StatChanges
  skillChanges?: Record<string, number>
}

export interface WorkRandomEvent {
  id: string
  title: string
  description: string
  probability: number
  cooldownDays: number
  minClicks?: number
  requiresSkill?: Record<string, number>
  requiresEducationRank?: number
  choices: WorkRandomEventChoice[]
}

export interface WeeklyJobDismissalParams {
  jobName: string
  worked: number
  required: number
  newWeekNumber: number
  jobId: string
}

