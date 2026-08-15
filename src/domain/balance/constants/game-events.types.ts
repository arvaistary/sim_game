import type { StatChanges } from '@/domain/balance/types'
import type { EventChoiceCanonical } from '@/domain/balance/constants/event-choice.types'

export type QueuedEventChoice = EventChoiceCanonical

export interface WorkRandomEventChoice extends EventChoiceCanonical {
  outcome: string
  statChanges: StatChanges
  skillChanges?: Record<string, number>
}

export type QueuedGameEventType =
  | 'age'
  | 'career'
  | 'finance'
  | 'micro'
  | 'weekly'
  | 'work'
  | 'yearly'

export interface QueuedGameEventData {
  earnedAmount?: number
  [key: string]: unknown
}

export interface QueuedGameEvent {
  id: string
  instanceId: string
  type: QueuedGameEventType
  title: string
  description: string
  choices: QueuedEventChoice[]
  data?: QueuedGameEventData
  actionSource?: string
  triggerAge?: number
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

export type { EventChoiceCanonical } from '@/domain/balance/constants/event-choice.types'
