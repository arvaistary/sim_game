export interface DisplayLogEntry {
  day: number
  type: string
  title: string
  description: string
  effects?: Record<string, number>
  raw: Record<string, unknown>
}
