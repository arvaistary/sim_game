import { computed } from 'vue'
import { useActivityStore, ACTIVITY_TYPES } from '@/stores'

export const ACTIVITY_CONSTANTS = { TYPES: ACTIVITY_TYPES }

export const useActivity = () => {
  const activityStore = useActivityStore()

  return {
    entries: computed(() => activityStore.entries),
    count: computed(() => activityStore.count),
    isEmpty: computed(() => activityStore.isEmpty),
    recentEntries: computed(() => activityStore.recentEntries),
    workEntries: computed(() => activityStore.workEntries),
    educationEntries: computed(() => activityStore.educationEntries),
    addEntry: activityStore.addEntry,
    addActionEntry: activityStore.addActionEntry,
    addWorkEntry: activityStore.addWorkEntry,
    addEducationEntry: activityStore.addEducationEntry,
    addEventEntry: activityStore.addEventEntry,
    getEntriesByType: activityStore.getEntriesByType,
    getEntriesByCategory: activityStore.getEntriesByCategory,
    clear: activityStore.clear,
    reset: activityStore.reset,
  }
}