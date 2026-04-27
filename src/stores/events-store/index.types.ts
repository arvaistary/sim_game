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
  data?: Record<string, unknown>
  day?: number
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

export interface EventsStore {
  eventQueue: GameEvent[]
  currentEvent: GameEvent | null
  eventHistory: EventHistoryEntry[]
  hasEvent: boolean
  queueLength: number
  historyCount: number
  nextEvent: GameEvent | null
  addToQueue: (event: GameEvent) => void
  setCurrentEvent: (event: GameEvent | null) => void
  showNextEvent: () => void
  resolveCurrentEvent: (choiceId: string, choiceText: string, effects?: Record<string, number>) => void
  applyChoice: (choiceId: string) => boolean
  skipEvent: () => void
  clearQueue: () => void
  hasSeenEvent: (eventId: string) => boolean
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}