
import type { StatsComponent, StatsState } from './index.types'
import { INITIAL_STATS } from './index.constants'
import { clamp } from '@utils/clamp'

function clampStat(value: number): number {
  return clamp(value, 0, 100)
}

export const useStatsStore = defineStore('stats', () => {
  const energy = ref<number>(INITIAL_STATS.energy)
  const health = ref<number>(INITIAL_STATS.health)
  const hunger = ref<number>(INITIAL_STATS.hunger)
  const stress = ref<number>(INITIAL_STATS.stress)
  const mood = ref<number>(INITIAL_STATS.mood)
  const physical = ref<number>(INITIAL_STATS.physical)

  const isFull = computed<boolean>(() =>
    energy.value >= 100 && health.value >= 100 && mood.value >= 100
  )

  const isTired = computed<boolean>(() => energy.value < 20)
  const isStarving = computed<boolean>(() => hunger.value > 80)
  const isStressed = computed<boolean>(() => stress.value > 80)
  const isHappy = computed<boolean>(() => mood.value > 70)

  const totalNegative = computed<number>(() => {
    const hungerPenalty: number = hunger.value > 50 ? hunger.value - 50 : 0
    const stressPenalty: number = stress.value > 50 ? stress.value - 50 : 0

    return hungerPenalty + stressPenalty
  })

  function applyStatChanges(changes: Partial<StatsComponent>): void {
    if (changes.energy !== undefined) {
      energy.value = clampStat(energy.value + changes.energy)
    }

    if (changes.health !== undefined) {
      health.value = clampStat(health.value + changes.health)
    }

    if (changes.hunger !== undefined) {
      hunger.value = clampStat(hunger.value + changes.hunger)
    }

    if (changes.stress !== undefined) {
      stress.value = clampStat(stress.value + changes.stress)
    }

    if (changes.mood !== undefined) {
      mood.value = clampStat(mood.value + changes.mood)
    }

    if (changes.physical !== undefined) {
      physical.value = clampStat(physical.value + changes.physical)
    }
  }

  function applyStatChangesRaw(changes: Record<string, number>): void {
    for (const [key, delta] of Object.entries(changes)) {
      switch (key) {
        case 'energy':
          energy.value = clampStat(energy.value + delta)
          break
        case 'health':
          health.value = clampStat(health.value + delta)
          break
        case 'hunger':
          hunger.value = clampStat(hunger.value + delta)
          break
        case 'stress':
          stress.value = clampStat(stress.value + delta)
          break
        case 'mood':
          mood.value = clampStat(mood.value + delta)
          break
        case 'physical':
          physical.value = clampStat(physical.value + delta)
          break
      }
    }
  }

  function setStats(newStats: Partial<StatsState>): void {
    if (newStats.energy !== undefined) energy.value = clampStat(newStats.energy)

    if (newStats.health !== undefined) health.value = clampStat(newStats.health)

    if (newStats.hunger !== undefined) hunger.value = clampStat(newStats.hunger)

    if (newStats.stress !== undefined) stress.value = clampStat(newStats.stress)

    if (newStats.mood !== undefined) mood.value = clampStat(newStats.mood)

    if (newStats.physical !== undefined) physical.value = clampStat(newStats.physical)
  }

  function setEnergy(value: number): void {
    energy.value = clampStat(value)
  }

  function restoreAll(): void {
    energy.value = 100
    health.value = 100
    mood.value = 100
    hunger.value = 0
    stress.value = 0
  }

  function reset(): void {
    energy.value = INITIAL_STATS.energy
    health.value = INITIAL_STATS.health
    hunger.value = INITIAL_STATS.hunger
    stress.value = INITIAL_STATS.stress
    mood.value = INITIAL_STATS.mood
    physical.value = INITIAL_STATS.physical
  }

  function save(): Record<string, unknown> {
    return {
      energy: energy.value,
      health: health.value,
      hunger: hunger.value,
      stress: stress.value,
      mood: mood.value,
      physical: physical.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (typeof data.energy === 'number') energy.value = clampStat(data.energy)

    if (typeof data.health === 'number') health.value = clampStat(data.health)

    if (typeof data.hunger === 'number') hunger.value = clampStat(data.hunger)

    if (typeof data.stress === 'number') stress.value = clampStat(data.stress)

    if (typeof data.mood === 'number') mood.value = clampStat(data.mood)

    if (typeof data.physical === 'number') physical.value = clampStat(data.physical)
  }

  return {
    energy,
    health,
    hunger,
    stress,
    mood,
    physical,
    isFull,
    isTired,
    isStarving,
    isStressed,
    isHappy,
    totalNegative,
    applyStatChanges,
    applyStatChangesRaw,
    setStats,
    setEnergy,
    restoreAll,
    reset,
    save,
    load,
  }
})

export * from './index.constants'
export type * from './index.types'
