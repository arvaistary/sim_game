/**
 * Типы миграции event schema в save payload.
 */

export interface LegacyEventChoice {
  id: string
  text: string
  effects?: Record<string, number>
  outcome?: string
}

export interface LegacyEventQueueItem {
  id: string
  type: string
  title: string
  description: string
  choices?: LegacyEventChoice[]
  data?: Record<string, unknown>
  day: number
  instanceId?: string
}

export interface LegacyEventHistoryEntry {
  eventId?: string
  templateId?: string
  instanceId?: string
  day: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
}

export interface CanonicalEventSkillCheck {
  key: string
  threshold: number
  successStatChanges?: Record<string, number>
  failStatChanges?: Record<string, number>
  successMoneyDelta?: number
  failMoneyDelta?: number
}

export interface CanonicalEventChoice {
  id: string
  text: string
  effects?: Record<string, number>
  outcome?: string
  skillCheck?: CanonicalEventSkillCheck
}

export interface CanonicalEventQueueItem {
  id: string
  instanceId: string
  type: string
  title: string
  description: string
  choices?: CanonicalEventChoice[]
  data?: Record<string, unknown>
  day: number
  week?: number
  month?: number
  year?: number
  priority?: string
}

export interface CanonicalEventHistoryEntry {
  instanceId: string
  templateId: string
  day: number
  week?: number
  month?: number
  year?: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
  resolvedAt?: number
}

export interface MigrationResult {
  success: boolean
  fromVersion: number
  toVersion: number
  migratedEvents: number
  errors: string[]
}
