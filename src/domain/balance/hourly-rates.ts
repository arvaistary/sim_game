import type { HourlyRateSet, BalanceConstants, SleepDebtPenalty, StatChanges } from '@/domain/balance/types'

export const HOURLY_RATES: Record<string, HourlyRateSet> = {
  work: {
    hunger: -2.2,
    energy: -2.7,
    stress: 1.9,
    mood: -1.0,
    health: -0.25,
    physical: -0.5,
  },
  neutral: {
    hunger: -1.4,
    energy: -1.6,
    stress: 0.6,
    mood: 0.4,
    health: -0.1,
    physical: -0.2,
  },
  sleep: {
    hunger: -0.6,
    energy: 6.8,
    stress: -3.1,
    mood: 2.5,
    health: 0.2,
    physical: 0.1,
  },
}

export const BALANCE_CONSTANTS: BalanceConstants = {
  HOURS_PER_DAY: 24,
  HOURS_PER_WEEK: 168,
  SLEEP_HOURS_RECOMMENDED: 8,
  SLEEP_HOURS_MINIMUM: 7,
  WORK_HOURS_STANDARD: 8,
  AGE_PENALTY_START: 40,
  AGE_PENALTY_RATE: 0.0075,
  MODIFIER_MIN: -0.40,
  MODIFIER_MAX: 0.30,
}

export function getAgingPenalty(currentAge: number): number {
  if (currentAge < BALANCE_CONSTANTS.AGE_PENALTY_START) return 1.0
  return 1.0 + (currentAge - BALANCE_CONSTANTS.AGE_PENALTY_START) * BALANCE_CONSTANTS.AGE_PENALTY_RATE
}

export function getSleepDebtPenalty(sleepDebt: number): SleepDebtPenalty {
  if (sleepDebt <= 0) return { energyPenalty: 0, stressPenalty: 0, efficiencyPenalty: 0 }
  return {
    energyPenalty: -(sleepDebt * 1.5),
    stressPenalty: sleepDebt * 0.8,
    efficiencyPenalty: -(sleepDebt * 2),
  }
}

export function calculateStatChanges(
  actionType: string,
  hours: number,
  flatStatChanges: StatChanges = {},
  modifiers: Record<string, number> = {},
  currentAge: number = 25,
  sleepDebt: number = 0,
): StatChanges {
  const rates = HOURLY_RATES[actionType] || HOURLY_RATES.neutral
  const agingMultiplier = getAgingPenalty(currentAge)
  const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt)
  const sleepPenalty =
    actionType === 'sleep'
      ? { ...sleepPenaltyRaw, energyPenalty: 0 }
      : sleepPenaltyRaw

  const result: Record<string, number> = {}

  const stats = ['hunger', 'energy', 'stress', 'mood', 'health', 'physical']

  for (const stat of stats) {
    let value = 0

    if (rates[stat as keyof HourlyRateSet] !== undefined) {
      value += rates[stat as keyof HourlyRateSet] * hours
    }

    if (flatStatChanges[stat] !== undefined) {
      value += flatStatChanges[stat]!
    }

    if (modifiers[stat] !== undefined) {
      value *= (1 + modifiers[stat])
    }

    if (value < 0) {
      value *= agingMultiplier
    }

    result[stat] = Math.round(value * 100) / 100
  }

  result.energy = (result.energy || 0) + sleepPenalty.energyPenalty
  result.stress = (result.stress || 0) + sleepPenalty.stressPenalty

  return result as StatChanges
}

