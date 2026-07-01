import type { Ref, ComputedRef } from 'vue'
import { resolveActivityLogTitle, resolveActivityLogDescription } from './utils/activity-log-formatters'
import type { DisplayLogEntry, UseActivityLogReturn } from './useActivityLog.types'
import type { ActivityEntry } from '@/stores/activity-store/activity-store.types'

/**
 * Composable для управления логом активности
 * @description Provides access to activity log entries with filtering and pagination
 * @return { UseActivityLogReturn } Activity log management functions and state
 */
export function useActivityLog(): UseActivityLogReturn {
  const activityStore = useActivityStore()

  const timeStore = useTimeStore()

  const PAGE_SIZE: number = 8

  const activeFilter: Ref<string> = ref<string>('all')
  const visibleCount: Ref<number> = ref(PAGE_SIZE)

  function fetchEntries(count: number): DisplayLogEntry[] {
    const raw: ActivityEntry[] = activityStore.getEntries(count)
    return raw.map((entry: ActivityEntry) => ({
      day: entry.day ?? 0,
      type: entry.type ?? 'unknown',
      title: resolveActivityLogTitle(entry as unknown as Parameters<typeof resolveActivityLogTitle>[0]),
      description: resolveActivityLogDescription(entry as unknown as Parameters<typeof resolveActivityLogDescription>[0]),
      effects: undefined,
      raw: entry as unknown as Record<string, unknown>,
    }))
  }

  const entries: ComputedRef<DisplayLogEntry[]> = computed<DisplayLogEntry[]>(() => {
    void timeStore.totalHours
    const all: DisplayLogEntry[] = fetchEntries(visibleCount.value)

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