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

export interface StatsStore {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
  isFull: boolean
  isTired: boolean
  isStarving: boolean
  isStressed: boolean
  isHappy: boolean
  totalNegative: number
  applyStatChanges: (changes: Partial<StatsComponent>) => void
  applyStatChangesRaw: (changes: Record<string, number>) => void
  setStats: (newStats: Partial<StatsState>) => void
  setEnergy: (value: number) => void
  restoreAll: () => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
