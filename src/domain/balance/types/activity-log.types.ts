export interface ActionMetadata {
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  moneyDelta?: number
  hoursSpent?: number
  actionId?: string
  [key: string]: unknown
}

export interface ActivityLogEntry {
  title?: string
  description?: string
  type?: string
  metadata?: ActionMetadata
}