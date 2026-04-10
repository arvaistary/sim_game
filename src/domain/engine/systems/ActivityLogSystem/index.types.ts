export interface LogTimestamp {
  day: number
  week: number
  month: number
  year: number
  hour: number
  totalHours: number
  age: number
}

export interface LogEntry {
  id: number
  type: string
  category: string | null
  title: string
  description: string
  icon: string | null
  timestamp: LogTimestamp
  metadata: Record<string, unknown>
  createdAt: number
}

export interface LogComponent {
  entries: LogEntry[]
  totalEntries: number
}

export interface GetEntriesOptions {
  limit?: number
  offset?: number
  type?: string
  sinceTotalHours?: number
}

export interface GetEntriesResult {
  entries: LogEntry[]
  total: number
  hasMore: boolean
}

export interface GetEntriesWindowOptions {
  limit?: number
  type?: string | null
  sinceTotalHours?: number
  endBefore?: number
}

export interface GetEntriesWindowResult {
  entries: LogEntry[]
  total: number
  hasMoreOlder: boolean
  rangeStart: number
  rangeEnd: number
}

export interface EventListenerEntry {
  eventName: string
  handler: EventListener
}
