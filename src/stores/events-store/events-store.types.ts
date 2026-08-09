import type { EventChoiceCanonical } from '@/domain/balance/constants/event-choice.types'

export type EventChoice = EventChoiceCanonical

export interface GameEvent {
  id: string
  instanceId: string
  type: string
  title: string
  description: string
  choices?: EventChoice[]
  data?: Record<string, unknown>
  priority?: string
}

export interface EventHistoryEntry {
  instanceId: string
  templateId: string
  day: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
}

export type { EventChoiceCanonical } from '@/domain/balance/constants/event-choice.types'
