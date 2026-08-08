import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { StatChanges } from '@/domain/balance/types'
import { getAllActions, getActionById, type BalanceAction } from '@/domain/balance/actions'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'
import type { DayEndHooks } from './day-end-hooks'
import { createNoopDayEndHooks } from './day-end-hooks'
import type { DayPlanInput, DayPlanResult, DayPlanStepResult, ExecuteActionResult, WorkShiftResult } from './commands.types'
import { executeActionCommand } from './execute-action'
import { simulateWorkShiftCommand } from './simulate-work-shift'
import { advanceHours } from './mutations'

const DAYS_PER_MONTH: number = 30
const DAYS_PER_YEAR: number = 365

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

/**
 * Выполнить атомарный план игрового дня.
 * @description [Domain] - последовательно применяет сон, работу и действия, затем закрывает остаток дня нейтральным временем.
 * @return { DayPlanResult } агрегированный результат выполнения плана
 */
export function planDayCommand(world: GameWorld, plan: DayPlanInput, hooks: DayEndHooks = createNoopDayEndHooks()): DayPlanResult {
  const actionIds: string[] = Array.isArray(plan.actionIds) ? plan.actionIds : []
  const sleepActionId: string | null = findSleepAction(plan.sleepHours)
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

  if (!Number.isFinite(plan.sleepHours) || plan.sleepHours < 0 || !sleepActionId) {
    return emptyResult(world, 'Недоступная длительность сна', plannedHours)
  }

  if (!Number.isFinite(workHours) || workHours < 0) {
    return emptyResult(world, 'Некорректная длительность работы', plannedHours)
  }

  if (actionIds.length > 3) {
    return emptyResult(world, 'Можно запланировать не более трёх действий', plannedHours)
  }

  if (hasInvalidFreeAction) {
    return emptyResult(world, 'План содержит недопустимое свободное действие', plannedHours)
  }

  if (plannedHours > initialRemaining) {
    return emptyResult(world, 'План превышает оставшееся время дня', plannedHours)
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

    if (step.success) addStepDelta(result, world, beforeStats, beforeMoney)
  }

  const beforeSleepStats: GameWorld['stats'] = { ...world.stats }
  const beforeSleepMoney: number = world.wallet.money
  const sleepResult: ExecuteActionResult = executeActionCommand(world, sleepActionId)
  run({ kind: 'sleep', actionId: sleepActionId, success: sleepResult.success, message: sleepResult.message, hoursSpent: sleepResult.success ? sleepResult.hoursSpent ?? plan.sleepHours : 0 }, beforeSleepStats, beforeSleepMoney)

  if (workHours > 0) {
    const beforeWorkStats: GameWorld['stats'] = { ...world.stats }
    const beforeWorkMoney: number = world.wallet.money
    const workResult: WorkShiftResult = simulateWorkShiftCommand(world, workHours)
    run({ kind: 'work', success: workResult.success, message: workResult.message, hoursSpent: workResult.success ? workResult.hoursWorked : 0 }, beforeWorkStats, beforeWorkMoney)
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

  hooks.onDayEnd(world)

  if (result.crossedWeekBoundary) hooks.onWeekEnd(world)

  if (result.crossedMonthBoundary) hooks.onMonthEnd(world)

  if (result.crossedYearBoundary) hooks.onYearEnd(world)

  if (result.ageChanged) hooks.onAgeChanged(world)

  return result
}
