import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
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
  const store = useGameStore()

  const activeFilter = ref<string>('all')
  const visibleCount = ref(PAGE_SIZE)

  function fetchEntries(count: number): DisplayLogEntry[] {
    const raw = store.getActivityLogEntries(count)
    return raw.map((entry) => ({
      day: (entry.day as number) ?? 0,
      type: (entry.type as string) ?? 'unknown',
      title: resolveActivityLogTitle(entry as Parameters<typeof resolveActivityLogTitle>[0]),
      description: resolveActivityLogDescription(entry as Parameters<typeof resolveActivityLogDescription>[0]),
      effects: entry.effects as Record<string, number> | undefined,
      raw: entry,
    }))
  }

  const entries = computed<DisplayLogEntry[]>(() => {
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

