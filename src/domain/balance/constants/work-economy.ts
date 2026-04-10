import type { StatChanges } from '@/domain/balance/types'

export const LEGACY_WORK_PERIOD_RANDOM_EVENT_CHANCE = 0.15

export const LEGACY_BASE_STAT_CHANGES_PER_WORK_DAY: StatChanges = {
  hunger: -18,
  energy: -24,
  stress: 12,
  mood: -2,
}

