import type { StatsData } from './default-save.types'

/** Единый внутренний baseline новой игры; hunger/stress инвертируются только в UI. */
export const INITIAL_STATS: StatsData = {
  hunger: 70,
  energy: 70,
  stress: 30,
  mood: 60,
  health: 80,
  physical: 50,
}
