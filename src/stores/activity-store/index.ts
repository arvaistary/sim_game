

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

const MAX_ENTRIES = 100

export const ACTIVITY_TYPES = {
  ACTION: 'action',
  EVENT: 'event',
  WORK: 'work',
  EDUCATION: 'education',
  RECOVERY: 'recovery',
  SOCIAL: 'social',
} as const

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES]

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

export const useActivityStore = defineStore('activity', () => {
  const entries = ref<ActivityEntry[]>([])
  const nextId = ref(0)

  const count = computed(() => entries.value.length)
  const isEmpty = computed(() => entries.value.length === 0)

  const recentEntries = computed(() => entries.value.slice(-10))
  const workEntries = computed(() => entries.value.filter(e => e.type === 'work'))
  const educationEntries = computed(() => entries.value.filter(e => e.type === 'education'))

  const addEntry = (entry: Omit<ActivityEntry, 'id'>): void => {
    const newEntry: ActivityEntry = {
      ...entry,
      id: `entry_${nextId.value++}`,
    }
    entries.value.push(newEntry)

    if (entries.value.length > MAX_ENTRIES) {
      entries.value = entries.value.slice(-MAX_ENTRIES)
    }
  }

  const addActionEntry = (
    title: string,
    description: string,
    metadata?: Record<string, unknown>
  ): void => {
    addEntry({
      type: 'action',
      title,
      description,
      category: metadata?.category as string,
      timestamp: Date.now(),
      totalHours: 0,
      age: 18,
      day: 0,
    })
  }

  const addWorkEntry = (
    title: string,
    hours: number,
    salary: number
  ): void => {
    addEntry({
      type: 'work',
      title,
      description: `Отработано ${hours}ч, зарплата ${salary}₽`,
      timestamp: Date.now(),
      totalHours: hours,
      age: 18,
      day: 0,
    })
  }

  const addEducationEntry = (
    title: string,
    hours: number
  ): void => {
    addEntry({
      type: 'education',
      title,
      description: `Изучено ${hours}ч`,
      timestamp: Date.now(),
      totalHours: hours,
      age: 18,
      day: 0,
    })
  }

  const addEventEntry = (
    title: string,
    description: string,
    choice?: string
  ): void => {
    addEntry({
      type: 'event',
      title,
      description: choice ? `${description} (${choice})` : description,
      timestamp: Date.now(),
      totalHours: 0,
      age: 18,
      day: 0,
    })
  }

  const getEntriesByType = (type: ActivityType): ActivityEntry[] => {
    return entries.value.filter(e => e.type === type)
  }

  const getEntriesByCategory = (category: string): ActivityEntry[] => {
    return entries.value.filter(e => e.category === category)
  }

  const getEntries = (count: number = 10): ActivityEntry[] => {
    return entries.value.slice(-count)
  }

  const clear = (): void => {
    entries.value = []
  }

  function reset(): void {
    entries.value = []
    nextId.value = 0
  }

  function save(): Record<string, unknown> {
    return {
      entries: entries.value,
      nextId: nextId.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (Array.isArray(data.entries)) entries.value = data.entries as ActivityEntry[]
    if (typeof data.nextId === 'number') nextId.value = data.nextId
  }

  return {
    entries,
    count,
    isEmpty,
    recentEntries,
    workEntries,
    educationEntries,
    addEntry,
    addActionEntry,
    addWorkEntry,
    addEducationEntry,
    addEventEntry,
    getEntriesByType,
    getEntriesByCategory,
    getEntries,
    clear,
    reset,
    save,
    load,
  }
})