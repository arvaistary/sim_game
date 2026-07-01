export interface ActivityLogEntry {
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

export const ACTIVITY_TYPES = {
  ACTION: 'action',
  EVENT: 'event',
  WORK: 'work',
  EDUCATION: 'education',
  RECOVERY: 'recovery',
  SOCIAL: 'social',
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]
