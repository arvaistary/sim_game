import type { Ref, ComputedRef } from 'vue'
import type { ActivityEntry, ActivityType } from './activity-store.types'

export type { ActivityEntry, ActivityType } from './activity-store.types'

const MAX_ENTRIES: number = 100

export const ACTIVITY_TYPES = {
  ACTION: 'action',
  EVENT: 'event',
  WORK: 'work',
  EDUCATION: 'education',
  RECOVERY: 'recovery',
  SOCIAL: 'social',
} as const

export const useActivityStore = defineStore('activity', () => {
  const entries: Ref<ActivityEntry[]> = ref<ActivityEntry[]>([])
  const nextId: Ref<number> = ref<number>(0)

  const count: ComputedRef<number> = computed(() => entries.value.length)
  const isEmpty: ComputedRef<boolean> = computed(() => entries.value.length === 0)

  const recentEntries: ComputedRef<ActivityEntry[]> = computed(() => entries.value.slice(-10))
  const workEntries: ComputedRef<ActivityEntry[]> = computed(() =>
    entries.value.filter(
      (e: ActivityEntry) => e.type === 'work'
    )
  )
  const educationEntries: ComputedRef<ActivityEntry[]> = computed(() =>
    entries.value.filter(
      (e: ActivityEntry) => e.type === 'education'
    )
  )

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
    const category: string | undefined = metadata?.category as string | undefined
    addEntry({
      type: 'action',
      title,
      description,
      category,
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
    const description: string = `Отработано ${hours}ч, зарплата ${salary}₽`
    addEntry({
      type: 'work',
      title,
      description,
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
    const description: string = `Изучено ${hours}ч`
    addEntry({
      type: 'education',
      title,
      description,
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
    const finalDescription: string = choice ? `${description} (${choice})` : description
    addEntry({
      type: 'event',
      title,
      description: finalDescription,
      timestamp: Date.now(),
      totalHours: 0,
      age: 18,
      day: 0,
    })
  }

  const getEntriesByType = (type: ActivityType): ActivityEntry[] => {
    return entries.value.filter(
      (e: ActivityEntry) => e.type === type
    )
  }

  const getEntriesByCategory = (category: string): ActivityEntry[] => {
    return entries.value.filter(
      (e: ActivityEntry) => e.category === category
    )
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
