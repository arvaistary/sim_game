import type { StatChangeBreakdownEntry, StatKey } from '@domain/balance/types'
import type { HourlyRateSet } from '@domain/balance/types'
import type { StatChanges } from '@domain/balance/types'
import type { BalanceConstants, SleepDebtPenalty } from '@domain/balance/types'
/**
 * Исторические почасовые ставки (раньше умножались на длительность действия).
 * Сейчас дельты по статам задаются целиком в `statChanges` действия; таблица оставлена
 * для справки и для скриптов миграции баланса.
 */
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

const STATS: StatKey[] = ['hunger', 'energy', 'stress', 'mood', 'health', 'physical']

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

function computeStatLine(
  stat: StatKey,
  flatStatChanges: StatChanges,
  modifiers: Record<string, number>,
  agingMultiplier: number,
): {
  baseFromAction: number
  valueAfterPerStatModifier: number
  agingApplied: boolean
  valueAfterAging: number
  roundedBeforeSleepDebt: number
} {
  const baseFromAction: number = flatStatChanges[stat] ?? 0
  let value = baseFromAction

  if (modifiers[stat] !== undefined) {
    value *= (1 + modifiers[stat]!)
  }

  const valueAfterPerStatModifier = value

  let agingApplied: boolean = false

  if (value < 0) {
    agingApplied = true
    value *= agingMultiplier
  }

  const valueAfterAging = value
  const roundedBeforeSleepDebt = Math.round(value * 100) / 100

  return {
    baseFromAction,
    valueAfterPerStatModifier,
    agingApplied,
    valueAfterAging,
    roundedBeforeSleepDebt,
  }
}

/**
 * Итоговые дельты по стам для действия: база только из `statChanges` (за целое действие),
 * затем модификаторы навыков (per-stat), старение отрицательных дельт, долг сна.
 * `actionType` влияет на обработку долга сна (сон не штрафует энергию от долга).
 * `hours` не участвует в расчёте статов — только время в неделе / UI («время Nч»).
 */
export function calculateStatChanges(
  actionType: string,
  _hours: number,
  flatStatChanges: StatChanges = {},
  modifiers: Record<string, number> = {},
  currentAge: number = 25,
  sleepDebt: number = 0,
): StatChanges {
  const agingMultiplier = getAgingPenalty(currentAge)
  const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt)
  const sleepPenalty =
    actionType === 'sleep'
      ? { ...sleepPenaltyRaw, energyPenalty: 0 }
      : sleepPenaltyRaw

  const result: Record<string, number> = {}

  for (const stat of STATS) {
    const line = computeStatLine(stat, flatStatChanges, modifiers, agingMultiplier)
    result[stat] = line.roundedBeforeSleepDebt
  }

  result.energy = (result.energy || 0) + sleepPenalty.energyPenalty
  result.stress = (result.stress || 0) + sleepPenalty.stressPenalty

  return result as StatChanges
}

export interface CalculateStatChangesWithBreakdownResult {
  statChanges: StatChanges
  breakdown: StatChangeBreakdownEntry[]
}

/**
 * Те же числа, что {@link calculateStatChanges}, плюс пошаговый разбор по каждой характеристике.
 */
export function calculateStatChangesWithBreakdown(
  actionType: string,
  hours: number,
  flatStatChanges: StatChanges = {},
  modifiers: Record<string, number> = {},
  currentAge: number = 25,
  sleepDebt: number = 0,
): CalculateStatChangesWithBreakdownResult {
  const agingMultiplier = getAgingPenalty(currentAge)
  const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt)
  const sleepPenalty =
    actionType === 'sleep'
      ? { ...sleepPenaltyRaw, energyPenalty: 0 }
      : sleepPenaltyRaw

  const statChanges = calculateStatChanges(
    actionType,
    hours,
    flatStatChanges,
    modifiers,
    currentAge,
    sleepDebt,
  )

  const breakdown: StatChangeBreakdownEntry[] = []

  for (const stat of STATS) {
    const line = computeStatLine(stat, flatStatChanges, modifiers, agingMultiplier)
    let sleepDebtDelta: number = 0

    if (stat === 'energy') {
      sleepDebtDelta = sleepPenalty.energyPenalty
    } else if (stat === 'stress') {
      sleepDebtDelta = sleepPenalty.stressPenalty
    }
    const final = (statChanges[stat] ?? 0) as number

    breakdown.push({
      stat,
      baseFromAction: line.baseFromAction,
      valueAfterPerStatModifier: line.valueAfterPerStatModifier,
      agingMultiplier,
      agingApplied: line.agingApplied,
      valueAfterAging: line.valueAfterAging,
      roundedBeforeSleepDebt: line.roundedBeforeSleepDebt,
      sleepDebtDelta,
      final,
    })
  }

  return { statChanges, breakdown }
}
