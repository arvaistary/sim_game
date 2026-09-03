import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { StatChanges, StatKey } from '@/domain/balance/types'
import { getAllActions, getActionById, type BalanceAction } from '@/domain/balance/actions'
import { NON_CRITICAL_DISPLAY_MIN } from '@/domain/balance/constants/stat-limits'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'
import type { DayEndHooks } from './day-end-hooks'
import { createNoopDayEndHooks } from './day-end-hooks'
import type { DayPlanInput, DayPlanResult, DayPlanStepResult, ExecuteActionResult, WorkShiftResult } from './commands.types'
import { executeActionCommand } from './execute-action'
import { simulateWorkShiftCommand } from './simulate-work-shift'
import { advanceHours, endLife, recordLifeDay } from './mutations'

const DAYS_PER_MONTH: number = 30
const DAYS_PER_YEAR: number = 365
const INVERTED_STAT_KEYS: ReadonlySet<StatKey> = new Set<StatKey>(['hunger', 'stress'])
const NON_CRITICAL_STAT_KEYS: readonly StatKey[] = ['hunger', 'stress', 'mood', 'physical']

function emptyResult(world: GameWorld, message: string, plannedHours: number = 0): DayPlanResult {
  return {
    success: false,
    message,
    steps: [],
    statChanges: {},
    moneyDelta: 0,
    plannedHours,
    idleHours: 0,
    totalHoursSpent: 0,
    dayNumber: Math.floor(world.time.totalHours / BALANCE_CONSTANTS.HOURS_PER_DAY),
    crossedWeekBoundary: false,
    crossedMonthBoundary: false,
    crossedYearBoundary: false,
    ageChanged: false,
  }
}

function addStats(target: StatChanges, before: GameWorld['stats'], after: GameWorld['stats']): void {
  for (const key of ['hunger', 'energy', 'stress', 'mood', 'health', 'physical'] as const) {
    const delta: number = after[key] - before[key]

    if (delta !== 0) target[key] = (target[key] ?? 0) + delta
  }
}

function addStepDelta(result: DayPlanResult, world: GameWorld, beforeStats: GameWorld['stats'], beforeMoney: number): void {
  addStats(result.statChanges, beforeStats, world.stats)
  result.moneyDelta += world.wallet.money - beforeMoney
}

function findSleepAction(hours: number): string | null {
  const action: BalanceAction | undefined = getAllActions().find(
    (candidate: BalanceAction) => candidate.actionType === 'sleep' && candidate.hourCost === hours,
  )
  return action?.id ?? null
}

function getDisplayedStatValue(stats: GameWorld['stats'], key: StatKey): number {
  return INVERTED_STAT_KEYS.has(key) ? 100 - stats[key] : stats[key]
}

function getStatLabel(key: StatKey): string {
  switch (key) {
    case 'hunger': return 'голод'
    case 'stress': return 'стресс'
    case 'mood': return 'настроение'
    case 'physical': return 'форма'
    case 'energy': return 'энергия'
    case 'health': return 'здоровье'
  }
}

function getPlanBlockingReason(stats: GameWorld['stats']): string | null {
  if (stats.energy <= 0) return 'Нельзя прожить период: энергия достигла нуля'

  if (stats.health <= 0) return 'Нельзя прожить период: здоровье достигло нуля'

  const blockedStat: StatKey | undefined = NON_CRITICAL_STAT_KEYS.find(
    (key: StatKey) => getDisplayedStatValue(stats, key) <= NON_CRITICAL_DISPLAY_MIN,
  )

  return blockedStat === undefined
    ? null
    : `Нельзя прожить период: шкала «${getStatLabel(blockedStat)}» достигла критического дефицита`
}

/**
 * Выполнить атомарный план игрового дня.
 * @description [Domain] - последовательно применяет сон, работу и действия, затем закрывает остаток дня нейтральным временем.
 * @return { DayPlanResult } агрегированный результат выполнения плана
 */
export function planDayCommand(world: GameWorld, plan: DayPlanInput, hooks: DayEndHooks = createNoopDayEndHooks()): DayPlanResult {
  const actionIds: string[] = Array.isArray(plan.actionIds) ? plan.actionIds : []
  const sleepActionId: string | null = plan.sleepHours > 0 ? findSleepAction(plan.sleepHours) : null
  const workHours: number = plan.workHours ?? 0
  const actionDefinitions: Array<BalanceAction | null> = actionIds.map(actionId => getActionById(actionId))
  const hasInvalidFreeAction: boolean = actionDefinitions.some(
    action => !action || action.actionType === 'sleep' || action.actionType === 'work',
  )
  const actionHours: number = actionDefinitions.reduce(
    (sum: number, action: BalanceAction | null) => sum + (action?.hourCost ?? 0),
    0,
  )
  const plannedHours: number = plan.sleepHours + workHours + actionHours
  const initialRemaining: number = world.time.totalHours % BALANCE_CONSTANTS.HOURS_PER_DAY === 0 && world.time.totalHours > 0
    ? BALANCE_CONSTANTS.HOURS_PER_DAY
    : world.time.dayHoursRemaining

  if (!Number.isFinite(plan.sleepHours) || plan.sleepHours < 0 || (plan.sleepHours > 0 && !sleepActionId)) {
    return emptyResult(world, 'Недоступная длительность сна', plannedHours)
  }

  if (!Number.isFinite(workHours) || workHours < 0) {
    return emptyResult(world, 'Некорректная длительность работы', plannedHours)
  }

  if (hasInvalidFreeAction) {
    return emptyResult(world, 'План содержит недопустимое свободное действие', plannedHours)
  }

  if (plannedHours > initialRemaining) {
    return emptyResult(world, 'План превышает оставшееся время дня', plannedHours)
  }

  const blockingReason: string | null = getPlanBlockingReason(world.stats)

  if (world.life.status === 'ended') return emptyResult(world, 'Игра завершена', plannedHours)

  if (blockingReason !== null) {
    if (world.stats.health <= 0) endLife(world, 'illness')
    return emptyResult(world, blockingReason, plannedHours)
  }

  const result: DayPlanResult = {
    success: true,
    message: 'День завершён',
    steps: [],
    statChanges: {},
    moneyDelta: 0,
    plannedHours,
    idleHours: 0,
    totalHoursSpent: 0,
    dayNumber: 0,
    crossedWeekBoundary: false,
    crossedMonthBoundary: false,
    crossedYearBoundary: false,
    ageChanged: false,
  }
  const startTotalHours: number = world.time.totalHours
  const startDay: number = Math.floor(startTotalHours / BALANCE_CONSTANTS.HOURS_PER_DAY)
  const startWeek: number = Math.floor(startDay / 7)
  const startMonth: number = Math.floor(startDay / DAYS_PER_MONTH)
  const startYear: number = Math.floor(startDay / DAYS_PER_YEAR)
  const startAge: number = world.player.currentAge
  const dayEndHours: number = startTotalHours + initialRemaining

  const run = (step: DayPlanStepResult, beforeStats: GameWorld['stats'], beforeMoney: number): void => {
    result.steps.push(step)

    if (step.success) {
      addStepDelta(result, world, beforeStats, beforeMoney)
    } else {
      result.success = false
      result.message = 'День выполнен частично'
    }
  }

  if (plan.sleepHours > 0 && sleepActionId !== null) {
    const beforeSleepStats: GameWorld['stats'] = { ...world.stats }
    const beforeSleepMoney: number = world.wallet.money
    const sleepResult: ExecuteActionResult = executeActionCommand(world, sleepActionId)
    run({ kind: 'sleep', actionId: sleepActionId, success: sleepResult.success, message: sleepResult.message, hoursSpent: sleepResult.success ? sleepResult.hoursSpent ?? plan.sleepHours : 0 }, beforeSleepStats, beforeSleepMoney)
  }

  if (workHours > 0) {
    const beforeWorkStats: GameWorld['stats'] = { ...world.stats }
    const beforeWorkMoney: number = world.wallet.money
    const workResult: WorkShiftResult = simulateWorkShiftCommand(world, workHours)
    run({
      kind: 'work',
      success: workResult.success,
      message: workResult.message,
      hoursSpent: workResult.success ? workResult.hoursWorked : 0,
      earnedAmount: workResult.success ? workResult.earnedAmount : undefined,
    }, beforeWorkStats, beforeWorkMoney)
  }

  for (const actionId of actionIds) {
    const beforeActionStats: GameWorld['stats'] = { ...world.stats }
    const beforeActionMoney: number = world.wallet.money
    const action: ExecuteActionResult = executeActionCommand(world, actionId)
    run({ kind: 'action', actionId, success: action.success, message: action.message, hoursSpent: action.success ? action.hoursSpent ?? getActionById(actionId)?.hourCost ?? 0 : 0 }, beforeActionStats, beforeActionMoney)
  }

  const idleHours: number = Math.max(0, dayEndHours - world.time.totalHours)

  if (idleHours > 0) {
    advanceHours(world, idleHours, 'idle')
    result.steps.push({ kind: 'idle', success: true, message: 'Остаток дня прошёл спокойно', hoursSpent: idleHours })
  }
  result.idleHours = idleHours
  result.totalHoursSpent = world.time.totalHours - startTotalHours
  const endDay: number = Math.floor(world.time.totalHours / BALANCE_CONSTANTS.HOURS_PER_DAY)
  const endWeek: number = Math.floor(endDay / 7)
  const endMonth: number = Math.floor(endDay / DAYS_PER_MONTH)
  const endYear: number = Math.floor(endDay / DAYS_PER_YEAR)
  result.dayNumber = endDay
  result.crossedWeekBoundary = endWeek !== startWeek
  result.crossedMonthBoundary = endMonth !== startMonth
  result.crossedYearBoundary = endYear !== startYear
  world.player.currentAge = world.player.startAge + endYear
  result.ageChanged = world.player.currentAge !== startAge

  const accidentTriggered: boolean = hooks.shouldTriggerAccident?.(world, result.crossedYearBoundary) ?? false
  recordLifeDay(world, accidentTriggered)

  if (world.life.deathCause !== null) {
    result.success = false
    result.message = 'Игра завершена'
    return result
  }

  hooks.onDayEnd(world, result)

  if (result.crossedWeekBoundary) hooks.onWeekEnd(world)

  if (result.crossedMonthBoundary) hooks.onMonthEnd(world)

  if (result.crossedYearBoundary) hooks.onYearEnd(world)

  if (result.ageChanged) hooks.onAgeChanged(world, { previousAge: startAge, currentAge: world.player.currentAge })

  return result
}
