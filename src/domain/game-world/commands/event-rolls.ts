/**
 * Роллы событий на границах дня/недели/месяца/года/возраста.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { MicroEvent } from '@/domain/balance/types'
import {
  MICRO_EVENT_BY_ACTION,
  WORK_RANDOM_EVENTS,
  GLOBAL_PROGRESS_EVENTS,
  WEEKLY_BONUS_MOMENT_EVENT,
  EVENT_FINANCE_CASH_GAP,
  EVENT_FINANCE_RESERVE_WARNING,
  buildEventFromWorkRandomEvent,
  buildMicroQueuedEvent,
  createWeeklySummaryQueuedEvent,
  createWeeklyJobDismissalQueuedEvent,
  createYearlyReflectionQueuedEvent,
  cloneQueuedEventTemplate,
} from '@/domain/balance/constants/game-events'
import type { QueuedGameEvent, WorkRandomEvent } from '@/domain/balance/constants/game-events.types'
import type { RandomSource } from '@/domain/game-world/random-source.types'
import type { AgeChangeContext } from './day-end-hooks.types'
import type { DayPlanStepResult, EventRollContext } from './commands.types'
import {
  addEventToQueue,
  processMonthlySettlementForWorld,
  resetCareerWeek,
} from './mutations'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'

function currentGameDay(world: GameWorld): number {
  return Math.floor(world.time.totalHours / BALANCE_CONSTANTS.HOURS_PER_DAY)
}

function isEventOnCooldown(world: GameWorld, eventId: string, day: number): boolean {
  const cooldownUntil: number | undefined = world.events.state.cooldownByEventId[eventId]

  if (cooldownUntil === undefined) return false

  return day < cooldownUntil
}

function setEventCooldown(world: GameWorld, eventId: string, day: number, cooldownDays: number): void {
  world.events.state.cooldownByEventId[eventId] = day + cooldownDays
}

function enqueueEvent(world: GameWorld, event: QueuedGameEvent): boolean {
  return addEventToQueue(world, event.instanceId, {
    ...event,
    priority: 'normal',
  })
}

function findSuccessfulWorkStep(steps: DayPlanStepResult[]): DayPlanStepResult | undefined {
  return steps.find((step: DayPlanStepResult) => step.kind === 'work' && step.success)
}

function resolveMicroDefinition(actionId: string): MicroEvent {
  const byAction: MicroEvent | undefined = MICRO_EVENT_BY_ACTION[actionId]
  const fallback: MicroEvent | undefined = MICRO_EVENT_BY_ACTION.default

  return byAction ?? fallback!
}

function recommendedReserve(world: GameWorld): number {
  const expensesSum: number = world.finance.expenseList.reduce(
    (sum: number, expense: { amount: number }) => sum + expense.amount,
    0,
  )

  return Math.max(1, expensesSum)
}

/**
 * Ролл рабочего события: не более одного за день (stop-after-first).
 * @description [Domain] - ставит work-событие в очередь при успешной смене.
 * @return { void }
 */
export function rollWorkEvent(world: GameWorld, rng: RandomSource, context: EventRollContext): void {
  const workStep: DayPlanStepResult | undefined = findSuccessfulWorkStep(context.dayResult.steps)

  if (!workStep) return

  const day: number = currentGameDay(world)
  const earnedAmount: number = workStep.earnedAmount ?? 0

  for (const event of WORK_RANDOM_EVENTS) {
    const workEvent: WorkRandomEvent = event

    if (isEventOnCooldown(world, workEvent.id, day)) continue

    if (rng.next() >= workEvent.probability) continue

    const queued: QueuedGameEvent = buildEventFromWorkRandomEvent(
      workEvent,
      earnedAmount,
      world.time.totalHours,
    )
    const added: boolean = enqueueEvent(world, queued)

    if (added) setEventCooldown(world, workEvent.id, day, workEvent.cooldownDays)

    return
  }
}

/**
 * Ролл микро-событий по успешным non-sleep шагам плана.
 * @description [Domain] - не более одного micro на шаг по baseChance.
 * @return { void }
 */
export function rollMicroEvents(world: GameWorld, rng: RandomSource, context: EventRollContext): void {
  const day: number = currentGameDay(world)

  for (const step of context.dayResult.steps) {
    if (!step.success) continue

    if (step.kind === 'sleep' || step.kind === 'idle') continue

    const actionKey: string = step.kind === 'work' ? 'work' : (step.actionId ?? 'default')
    const def: MicroEvent = resolveMicroDefinition(actionKey)

    if (isEventOnCooldown(world, def.id, day)) continue

    if (rng.next() >= def.baseChance) continue

    const queued: QueuedGameEvent = buildMicroQueuedEvent(def, actionKey, world.time.totalHours)
    const added: boolean = enqueueEvent(world, queued)

    if (added) setEventCooldown(world, def.id, day, 30)
  }
}

/**
 * Недельная сводка и опциональное увольнение.
 * @description [Domain] - всегда summary; dismissal при недоработке и employment.
 * @return { void }
 */
export function rollWeeklyEvents(world: GameWorld): void {
  const day: number = currentGameDay(world)
  const weekNumber: number = Math.floor(day / 7)

  if (world.events.state.lastWeeklyEventWeek === weekNumber) return

  const summary: QueuedGameEvent = createWeeklySummaryQueuedEvent(weekNumber)

  enqueueEvent(world, summary)

  if (!isEventOnCooldown(world, WEEKLY_BONUS_MOMENT_EVENT.id, day)) {
    const bonus: QueuedGameEvent = {
      ...cloneQueuedEventTemplate(WEEKLY_BONUS_MOMENT_EVENT),
      instanceId: `weekly_bonus_moment_${weekNumber}`,
    }

    if (enqueueEvent(world, bonus)) {
      setEventCooldown(world, WEEKLY_BONUS_MOMENT_EVENT.id, day, 7)
    }
  }

  const job: GameWorld['career']['currentJob'] = world.career.currentJob

  if (job.employed && job.workedHoursCurrentWeek < job.requiredHoursPerWeek) {
    const dismissal: QueuedGameEvent = createWeeklyJobDismissalQueuedEvent({
      jobName: job.name,
      worked: job.workedHoursCurrentWeek,
      required: job.requiredHoursPerWeek,
      newWeekNumber: weekNumber,
      jobId: job.id,
    })

    enqueueEvent(world, dismissal)
  }

  resetCareerWeek(world)
  world.events.state.lastWeeklyEventWeek = weekNumber
}

/**
 * Месячный settlement и finance-события.
 * @description [Domain] - processMonthlySettlementForWorld + FR-016.
 * @return { void }
 */
export function rollMonthlyEvents(world: GameWorld): void {
  const day: number = currentGameDay(world)
  const monthNumber: number = Math.floor(day / 30)

  if (world.events.state.lastMonthlyEventMonth === monthNumber) return

  processMonthlySettlementForWorld(world)
  world.events.state.lastMonthlyEventMonth = monthNumber

  if (world.wallet.money < 0) {
    const cashGap: QueuedGameEvent = {
      ...cloneQueuedEventTemplate(EVENT_FINANCE_CASH_GAP),
      instanceId: `finance_cash_gap_${day}`,
    }

    if (!isEventOnCooldown(world, cashGap.id, day) && enqueueEvent(world, cashGap)) {
      setEventCooldown(world, cashGap.id, day, 30)
    }
  }

  if (world.wallet.reserveFund < recommendedReserve(world)) {
    const warning: QueuedGameEvent = {
      ...cloneQueuedEventTemplate(EVENT_FINANCE_RESERVE_WARNING),
      instanceId: `finance_reserve_warning_${day}`,
    }

    if (!isEventOnCooldown(world, warning.id, day) && enqueueEvent(world, warning)) {
      setEventCooldown(world, warning.id, day, 30)
    }
  }
}

/**
 * Годовое размышление.
 * @description [Domain] - одно yearly_reflection на onYearEnd.
 * @return { void }
 */
export function rollYearlyEvents(world: GameWorld): void {
  const day: number = currentGameDay(world)
  const yearNumber: number = Math.floor(day / 365)

  if (world.events.state.lastYearlyEventYear === yearNumber) return

  const yearly: QueuedGameEvent = createYearlyReflectionQueuedEvent(yearNumber)

  enqueueEvent(world, yearly)
  world.events.state.lastYearlyEventYear = yearNumber
}

/**
 * Возрастные события при пересечении порога.
 * @description [Domain] - GLOBAL_PROGRESS_EVENTS с triggerAge между previous и current.
 * @return { void }
 */
export function rollAgeEvents(
  world: GameWorld,
  _rng: RandomSource,
  ageContext: AgeChangeContext,
): void {
  const day: number = currentGameDay(world)

  for (const event of GLOBAL_PROGRESS_EVENTS) {
    if (typeof event.triggerAge !== 'number') continue

    const triggerAge: number = event.triggerAge

    if (ageContext.previousAge >= triggerAge) continue

    if (ageContext.currentAge < triggerAge) continue

    if (isEventOnCooldown(world, event.id, day)) continue

    const queued: QueuedGameEvent = {
      id: event.id,
      instanceId: `${event.id}_${ageContext.currentAge}`,
      type: 'age',
      title: event.title,
      description: event.description,
      choices: cloneQueuedEventTemplate(event.choices),
      triggerAge,
    }
    const added: boolean = enqueueEvent(world, queued)

    if (added) setEventCooldown(world, event.id, day, 3650)
  }
}
