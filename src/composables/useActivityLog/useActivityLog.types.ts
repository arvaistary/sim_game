import type { Ref, ComputedRef } from 'vue'
import type { ActivityEntry } from '@/stores/activity-store/activity-store.types'

export interface DisplayLogEntry {
  day: number
  type: string
  title: string
  description: string
  effects?: Record<string, number>
  raw: Record<string, unknown>
}

export type UseActivityLogReturn = {
  entries: ComputedRef<DisplayLogEntry[]>
  activeFilter: Ref<string>
  setFilter: (filter: string) => void
  loadMore: () => void
}