import type { MicroEventChoice } from '@domain/balance/types'
import type { MicroEvent, StatChanges } from '@domain/balance/types'
export interface CreateWeeklyJobDismissalParams {
  jobName: string
  worked: number
  required: number
  newWeekNumber: number
  jobId: string
}

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

export interface QueuedEventChoice {
  label: string
  outcome: string
  statChanges: StatChanges
  skillChanges?: Record<string, number>
}

export interface MicroQueuedEvent extends MicroEvent {
  type: 'micro'
  actionSource: string
  instanceId: string
  choices: MicroEventChoice[]
}

export interface WeeklySummaryQueuedEvent {
  id: string
  type: 'weekly'
  title: string
  description: string
  choices: QueuedEventChoice[]
  instanceId: string
}

export interface YearlyReflectionQueuedEvent {
  id: string
  type: 'yearly'
  title: string
  description: string
  choices: QueuedEventChoice[]
  instanceId: string
}

export interface JobDismissalQueuedEvent {
  id: string
  type: 'career'
  title: string
  description: string
  choices: QueuedEventChoice[]
  instanceId: string
}