import { describe, expect, it } from 'vitest'

import { GameWorld } from '@/domain/game-world/GameWorld'
import type { QueuedGameEvent } from '@/domain/balance/constants/game-events.types'
import {
  rollAgeEvents,
  rollMicroEvents,
  rollMonthlyEvents,
  rollWeeklyEvents,
  rollWorkEvent,
  rollYearlyEvents,
} from '@/domain/game-world/commands'
import type { DayPlanResult, DayPlanStepResult } from '@/domain/game-world/commands'

import { createFakeRandomSource } from './__fixtures__/fake-random-source'

function createEmployedWorld(totalHours: number = 0): GameWorld {
  const world: GameWorld = GameWorld.createEmpty({
    time: {
      totalHours,
      hourOfDay: totalHours % 24,
      dayOfWeek: 1,
      weekHoursSpent: totalHours % 168,
      weekHoursRemaining: 168 - (totalHours % 168),
      dayHoursSpent: totalHours % 24,
      dayHoursRemaining: 24 - (totalHours % 24),
      sleepHoursToday: 0,
      sleepDebt: 0,
    },
    wallet: { money: 1_000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    career: {
      currentJob: {
        id: 'job',
        name: 'Job',
        schedule: '5/2',
        employed: true,
        salaryPerHour: 10,
        salaryPerWeek: 400,
        salaryPerDay: 80,
        requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 0,
        pendingSalaryWeek: 0,
        totalWorkedHours: 0,
        level: 1,
        daysAtWork: 0,
      },
      jobHistory: [],
      careerLevel: 1,
      promotions: 0,
    },
  })

  return world
}

function createDayResult(steps: DayPlanStepResult[]): DayPlanResult {
  const result: DayPlanResult = {
    success: true,
    message: 'День завершён',
    steps,
    statChanges: {},
    moneyDelta: 0,
    plannedHours: 24,
    idleHours: 0,
    totalHoursSpent: 24,
    dayNumber: 1,
    crossedWeekBoundary: false,
    crossedMonthBoundary: false,
    crossedYearBoundary: false,
    ageChanged: false,
  }

  return result
}

function getPendingEvents(world: GameWorld): QueuedGameEvent[] {
  const pendingEvents: QueuedGameEvent[] = world.events.pending as QueuedGameEvent[]

  return pendingEvents
}

describe('event rolls', () => {
  it('T016 rollWorkEvent stops after first successful work event', () => {
    const world: GameWorld = createEmployedWorld(24)
    const dayResult: DayPlanResult = createDayResult([
      { kind: 'work', success: true, message: 'Смена завершена', hoursSpent: 8, earnedAmount: 80 },
    ])

    rollWorkEvent(world, createFakeRandomSource([0]), { dayResult })

    const pendingEvents: QueuedGameEvent[] = getPendingEvents(world)

    expect(pendingEvents).toHaveLength(1)
    expect(pendingEvents[0]).toMatchObject({
      id: 'deadline_push',
      type: 'work',
      data: { earnedAmount: 80 },
    })
    expect(world.events.state.cooldownByEventId.deadline_push).toBe(19)
  })

  it('T017 cooldown blocks same work eventId', () => {
    const world: GameWorld = createEmployedWorld(24)
    const dayResult: DayPlanResult = createDayResult([
      { kind: 'work', success: true, message: 'Смена завершена', hoursSpent: 8, earnedAmount: 80 },
    ])

    world.events.state.cooldownByEventId.deadline_push = 19

    rollWorkEvent(world, createFakeRandomSource([0]), { dayResult })

    const pendingEvents: QueuedGameEvent[] = getPendingEvents(world)

    expect(pendingEvents).toHaveLength(1)
    expect(pendingEvents[0]?.id).toBe('colleague_help')
    expect(pendingEvents[0]?.id).not.toBe('deadline_push')
  })

  it('T018 no successful work step produces no work random events', () => {
    const world: GameWorld = createEmployedWorld(24)
    const dayResult: DayPlanResult = createDayResult([
      { kind: 'work', success: false, message: 'Смена сорвалась', hoursSpent: 0 },
      { kind: 'action', actionId: 'fun_park_walk', success: true, message: 'Прогулка', hoursSpent: 2 },
    ])

    rollWorkEvent(world, createFakeRandomSource([0]), { dayResult })

    expect(getPendingEvents(world)).toEqual([])
  })

  it('T050 rollMicroEvents uses default micro, ignores sleep/idle, and respects cooldown', () => {
    const world: GameWorld = createEmployedWorld(24)
    const dayResult: DayPlanResult = createDayResult([
      { kind: 'sleep', actionId: 'fun_sleep_normal', success: true, message: 'Сон', hoursSpent: 7 },
      { kind: 'idle', success: true, message: 'Спокойный остаток дня', hoursSpent: 8 },
      { kind: 'action', actionId: 'unknown_action', success: true, message: 'Действие', hoursSpent: 2 },
      { kind: 'action', actionId: 'another_unknown_action', success: true, message: 'Ещё действие', hoursSpent: 2 },
    ])

    rollMicroEvents(world, createFakeRandomSource([0]), { dayResult })

    const pendingEvents: QueuedGameEvent[] = getPendingEvents(world)

    expect(pendingEvents).toHaveLength(1)
    expect(pendingEvents[0]).toMatchObject({
      id: 'micro_minor_injury',
      type: 'micro',
      actionSource: 'unknown_action',
    })
    expect(world.events.state.cooldownByEventId.micro_minor_injury).toBe(31)
  })

  it('T051 enqueue appends when pending already has an event', () => {
    const world: GameWorld = createEmployedWorld(24)
    const existingEvent: QueuedGameEvent = {
      id: 'existing_event',
      instanceId: 'existing_event_1',
      type: 'weekly',
      title: 'Существующее событие',
      description: 'Уже было в очереди',
      choices: [],
    }
    const dayResult: DayPlanResult = createDayResult([
      { kind: 'action', actionId: 'unknown_action', success: true, message: 'Действие', hoursSpent: 2 },
    ])

    getPendingEvents(world).push(existingEvent)

    rollMicroEvents(world, createFakeRandomSource([0]), { dayResult })

    const pendingEvents: QueuedGameEvent[] = getPendingEvents(world)

    expect(pendingEvents).toHaveLength(2)
    expect(pendingEvents[0]?.instanceId).toBe('existing_event_1')
    expect(pendingEvents[1]?.id).toBe('micro_minor_injury')
  })

  it('T025 rollWeeklyEvents enqueues weekly_summary and weekly_bonus_moment on full hours', () => {
    const world: GameWorld = createEmployedWorld(7 * 24)

    world.career.currentJob.workedHoursCurrentWeek = 40

    rollWeeklyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual([
      'weekly_summary',
      'weekly_bonus_moment',
    ])
  })

  it('T026 rollWeeklyEvents also enqueues job_dismissal for undertime employed worker', () => {
    const world: GameWorld = createEmployedWorld(7 * 24)

    world.career.currentJob.workedHoursCurrentWeek = 32

    rollWeeklyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual([
      'weekly_summary',
      'weekly_bonus_moment',
      'job_dismissal',
    ])
  })

  it('T053 rollWeeklyEvents keeps summary and bonus for unemployed player', () => {
    const world: GameWorld = createEmployedWorld(7 * 24)

    world.career.currentJob.employed = false

    rollWeeklyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual([
      'weekly_summary',
      'weekly_bonus_moment',
    ])
  })

  it('T033 rollAgeEvents enqueues reunion on crossing age 30', () => {
    const world: GameWorld = createEmployedWorld(365 * 12)

    rollAgeEvents(world, createFakeRandomSource([0]), { previousAge: 29, currentAge: 30 })

    const pendingEvents: QueuedGameEvent[] = getPendingEvents(world)

    expect(pendingEvents).toHaveLength(1)
    expect(pendingEvents[0]?.id).toBe('age_30_reunion')
  })

  it.each([
    [39, 40, 'age_40_milestone'],
    [49, 50, 'age_50_milestone'],
    [59, 60, 'age_60_milestone'],
  ])('T054 rollAgeEvents enqueues %s->%s milestone', (previousAge: number, currentAge: number, eventId: string) => {
    const world: GameWorld = createEmployedWorld(365 * currentAge)

    rollAgeEvents(world, createFakeRandomSource([0]), { previousAge, currentAge })

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual([eventId])
  })

  it('T055 rollYearlyEvents enqueues yearly_reflection', () => {
    const world: GameWorld = createEmployedWorld(365 * 24)

    rollYearlyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual(['yearly_reflection'])
  })

  it('T056 rollMonthlyEvents enqueues cash-gap and reserve-warning events', () => {
    const world: GameWorld = createEmployedWorld(60 * 24)

    world.wallet.money = -100
    world.wallet.reserveFund = 10
    world.finance.expenseList = [{ category: 'rent', amount: 100 }]

    rollMonthlyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual([
      'finance_cash_gap',
      'finance_reserve_warning',
    ])
    expect(world.finance.lastMonthlySettlement).not.toBeNull()
  })

  it('T057 rollWeeklyEvents resets workedHoursCurrentWeek after processing week', () => {
    const world: GameWorld = createEmployedWorld(7 * 24)

    world.career.currentJob.workedHoursCurrentWeek = 40

    rollWeeklyEvents(world)

    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(0)
    expect(world.events.state.lastWeeklyEventWeek).toBe(1)
  })

  it('T058 rollWeeklyEvents is idempotent for the same week', () => {
    const world: GameWorld = createEmployedWorld(7 * 24)

    world.career.currentJob.workedHoursCurrentWeek = 40

    rollWeeklyEvents(world)
    const pendingAfterFirst: number = getPendingEvents(world).length

    rollWeeklyEvents(world)

    expect(getPendingEvents(world).length).toBe(pendingAfterFirst)
    expect(world.events.state.lastWeeklyEventWeek).toBe(1)
  })

  it('T059 rollMonthlyEvents is idempotent for the same month', () => {
    const world: GameWorld = createEmployedWorld(30 * 24)

    rollMonthlyEvents(world)
    const moneyAfterFirst: number = world.wallet.money

    rollMonthlyEvents(world)

    expect(world.wallet.money).toBe(moneyAfterFirst)
    expect(world.events.state.lastMonthlyEventMonth).toBe(1)
  })

  it('T060 rollYearlyEvents is idempotent for the same year', () => {
    const world: GameWorld = createEmployedWorld(365 * 24)

    rollYearlyEvents(world)
    rollYearlyEvents(world)

    expect(getPendingEvents(world).map((event: QueuedGameEvent) => event.id)).toEqual(['yearly_reflection'])
  })
})
