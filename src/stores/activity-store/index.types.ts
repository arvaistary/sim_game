export type ActivityType = 'action' | 'event' | 'work' | 'education' | 'recovery' | 'social'

export interface ActivityEntry {
  id: string
  type: ActivityType
  title: string
  description: string
  category?: string
  timestamp: number
  totalHours: number
  age: number
  day: number
}

export interface ActivityStore {
  entries: ActivityEntry[]
  count: number
  isEmpty: boolean
  recentEntries: ActivityEntry[]
  workEntries: ActivityEntry[]
  educationEntries: ActivityEntry[]
  addEntry: (entry: Omit<ActivityEntry, 'id'>) => void
  addActionEntry: (title: string, description: string, metadata?: Record<string, unknown>) => void
  addWorkEntry: (title: string, hours: number, salary: number) => void
  addEducationEntry: (title: string, hours: number) => void
  addEventEntry: (title: string, description: string, choice?: string) => void
  getEntriesByType: (type: ActivityType) => ActivityEntry[]
  getEntriesByCategory: (category: string) => ActivityEntry[]
  getEntries: (count?: number) => ActivityEntry[]
  clear: () => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
