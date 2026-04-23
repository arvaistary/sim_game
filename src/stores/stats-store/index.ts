import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface StatsComponent {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}

export interface StatsState {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}

const INITIAL_STATS: StatsState = {
  energy: 100,
  health: 100,
  hunger: 0,
  stress: 0,
  mood: 100,
  physical: 50,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function clampStat(value: number): number {
  return clamp(value, 0, 100)
}

export const useStatsStore = defineStore('stats', () => {
  const energy = ref(INITIAL_STATS.energy)
  const health = ref(INITIAL_STATS.health)
  const hunger = ref(INITIAL_STATS.hunger)
  const stress = ref(INITIAL_STATS.stress)
  const mood = ref(INITIAL_STATS.mood)
  const physical = ref(INITIAL_STATS.physical)

  const isFull = computed(() => 
    energy.value >= 100 && health.value >= 100 && mood.value >= 100
  )

  const isTired = computed(() => energy.value < 20)
  const isStarving = computed(() => hunger.value > 80)
  const isStressed = computed(() => stress.value > 80)
  const isHappy = computed(() => mood.value > 70)

  const totalNegative = computed(() => {
    const hungerPenalty = hunger.value > 50 ? hunger.value - 50 : 0
    const stressPenalty = stress.value > 50 ? stress.value - 50 : 0
    return hungerPenalty + stressPenalty
  })

  function applyStatChanges(changes: Partial<StatsComponent>) {
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

  function applyStatChangesRaw(changes: Record<string, number>) {
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

  function setStats(newStats: Partial<StatsState>) {
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

  function restoreAll() {
    energy.value = 100
    health.value = 100
    mood.value = 100
    hunger.value = 0
    stress.value = 0
  }

  function reset() {
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