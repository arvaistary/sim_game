import { ref, computed } from 'vue'
import { useActivityStore } from '@/stores/activity-store'
import { useTimeStore } from '@/stores/time-store'
import { resolveActivityLogTitle, resolveActivityLogDescription } from './utils/activity-log-formatters'

const PAGE_SIZE = 8

export interface DisplayLogEntry {
  day: number
  type: string
  title: string
  description: string
  effects?: Record<string, number>
  raw: Record<string, unknown>
}

export function useActivityLog() {
  const activityStore = useActivityStore()
  const timeStore = useTimeStore()

  const activeFilter = ref<string>('all')
  const visibleCount = ref(PAGE_SIZE)

  function fetchEntries(count: number): DisplayLogEntry[] {
    const raw = activityStore.getEntries(count)
    return raw.map((entry) => ({
      day: entry.day ?? 0,
      type: entry.type ?? 'unknown',
      title: resolveActivityLogTitle(entry as unknown as Parameters<typeof resolveActivityLogTitle>[0]),
      description: resolveActivityLogDescription(entry as unknown as Parameters<typeof resolveActivityLogDescription>[0]),
      effects: undefined,
      raw: entry as unknown as Record<string, unknown>,
    }))
  }

  const entries = computed<DisplayLogEntry[]>(() => {
    void timeStore.totalHours
    const all = fetchEntries(visibleCount.value)
    if (activeFilter.value === 'all') return all
    return all.filter((e) => e.type === activeFilter.value)
  })

  function setFilter(filter: string): void {
    activeFilter.value = filter
    visibleCount.value = PAGE_SIZE
  }

  function loadMore(): void {
    visibleCount.value += PAGE_SIZE
  }

  return {
    entries,
    activeFilter,
    setFilter,
    loadMore,
  }
}