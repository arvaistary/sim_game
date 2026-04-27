import type { AgeGroup } from '@domain/balance/actions/types'

export interface AgeRestrictions {
  hiddenTabs: string[]
  hiddenStats: string[]
  label: string
  timeSpeed: number
  minAgeGroup: AgeGroup
}
