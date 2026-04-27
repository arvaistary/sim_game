import type { StatChanges, StatChangeBreakdownEntry } from '@domain/balance/types'

export interface ComputeStatLineResult {
  baseFromAction: number
  valueAfterPerStatModifier: number
  agingApplied: boolean
  valueAfterAging: number
  roundedBeforeSleepDebt: number
}

export interface CalculateStatChangesInput {
  actionType: string
  hours: number
  flatStatChanges?: StatChanges
  modifiers?: Record<string, number>
  currentAge?: number
  sleepDebt?: number
}

export interface CalculateStatChangesWithBreakdownResult {
  statChanges: StatChanges
  breakdown: StatChangeBreakdownEntry[]
}
