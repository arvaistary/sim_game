export interface EventChoice {
  id: string
  text: string
  effects?: Record<string, number>
  outcome?: string
}

export interface EventQueueItem {
  id: string
  title: string
  description: string
  choices?: EventChoice[]
}

export interface GameEvent {
  id: string
  instanceId: string
  type: string
  title: string
  description: string
  choices?: EventChoice[]
  data?: Record<string, unknown>
  priority: string
}

export interface EventHistoryEntry {
  instanceId: string
  templateId: string
  day: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
}
