export interface HistoryEvent {
  instanceId: string
  templateId: string
  title: string
  type: string
  actionSource: string | null
  day: number
  week: number
  month?: number
  year?: number
  timestampHours: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
  resolvedAt?: number
}

export interface EventStats {
  total: number
  byType: Record<string, number>
  lastInstanceId: string | null
  lastTemplateId: string | null
}
