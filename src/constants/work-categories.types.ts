export type IndustryId = 'all' | 'office' | 'production' | 'management' | 'analytics' | 'freelance' | 'executive'

export interface WorkType {
  id: 'full-time' | 'part-time'
  label: string
  subtitle: string
  icon: string
  scheduleFilter: string[]
}

export interface Industry {
  id: IndustryId
  label: string
  icon: string
}
