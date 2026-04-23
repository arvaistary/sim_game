import { computed } from 'vue'
import { useStatsStore } from '@/stores'

export const useStats = () => {
  const statsStore = useStatsStore()

  return {
    energy: computed(() => statsStore.energy),
    health: computed(() => statsStore.health),
    hunger: computed(() => statsStore.hunger),
    stress: computed(() => statsStore.stress),
    mood: computed(() => statsStore.mood),
    physical: computed(() => statsStore.physical),
    isFull: computed(() => statsStore.isFull),
    isTired: computed(() => statsStore.isTired),
    isStarving: computed(() => statsStore.isStarving),
    isStressed: computed(() => statsStore.isStressed),
    isHappy: computed(() => statsStore.isHappy),
    totalNegative: computed(() => statsStore.totalNegative),
    applyStatChanges: statsStore.applyStatChanges,
    applyStatChangesRaw: statsStore.applyStatChangesRaw,
    setStats: statsStore.setStats,
    restoreAll: statsStore.restoreAll,
    reset: statsStore.reset,
  }
}