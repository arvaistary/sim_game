export interface WorkType {
  id: 'full-time' | 'part-time'
  label: string
  subtitle: string
  icon: string
  scheduleFilter: string[]
}

export interface Industry {
  id: string
  label: string
  icon: string
}
