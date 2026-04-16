export interface HistoryEvent {
  eventId: string
  title: string
  type: string
  actionSource: string | null
  day: number
  week: number
  timestampHours: number
}

export interface EventStats {
  total: number
  byType: Record<string, number>
  lastEventId: string | null
}
