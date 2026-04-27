import type { DisplayLogEntry } from './index.types'
import { PAGE_SIZE } from './index.constants'
import { resolveActivityLogDescription, resolveActivityLogTitle } from './utils/activity-log-formatters'
import type { ActivityEntry } from '@stores/activity-store/index.types'

/**
 * @description [Composable] - builds the activity log view state with filtering and pagination.
 * @return { ReturnType } reactive activity log state and actions
 */
export const useActivityLog = () => {
  const activityStore = useActivityStore()
  const timeStore = useTimeStore()

  const activeFilter = ref<string>('all')
  const visibleCount = ref<number>(PAGE_SIZE)

  function fetchEntries(count: number): DisplayLogEntry[] {
    const rawEntries: ActivityEntry[] = activityStore.getEntries(count)

    return rawEntries.map((entry) => ({
      day: entry.day ?? 0,
      type: entry.type ?? 'unknown',
      title: resolveActivityLogTitle(entry),
      description: resolveActivityLogDescription(entry),
      effects: undefined,
      raw: entry as unknown as Record<string, unknown>,
    }))
  }

  const entries = computed<DisplayLogEntry[]>(() => {
    void timeStore.totalHours

    const allEntries: DisplayLogEntry[] = fetchEntries(visibleCount.value)

    if (activeFilter.value === 'all') return allEntries

    return allEntries.filter((entry) => entry.type === activeFilter.value)
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