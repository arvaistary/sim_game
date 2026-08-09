import { describe, expect, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'

import { GameWorld } from '@/domain/game-world/GameWorld'
import type { QueuedGameEvent } from '@/domain/balance/constants/game-events.types'
import type { DayEndHooks } from '@/domain/game-world/commands'
import { createLiveDayEndHooks, planDayCommand } from '@/domain/game-world/commands'
import * as mutationsModule from '@/domain/game-world/commands/mutations'

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

function getPendingEvents(world: GameWorld): QueuedGameEvent[] {
  const pendingEvents: QueuedGameEvent[] = world.events.pending as QueuedGameEvent[]

  return pendingEvents
}

describe('event rolls integration', () => {
  it('T024 createLiveDayEndHooks limits work random events to at most one per day', () => {
    const world: GameWorld = createEmployedWorld()
    const hooks: DayEndHooks = createLiveDayEndHooks(createFakeRandomSource([0, 0, 0, 0]))
    const workEventDays: number[] = []

    world.events.state.cooldownByEventId.micro_minor_injury = 999

    for (let dayIndex: number = 0; dayIndex < 10; dayIndex += 1) {
      const beforeLength: number = getPendingEvents(world).length

      planDayCommand(world, { sleepHours: 7, workHours: 8, actionIds: [] }, hooks)

      const newEvents: QueuedGameEvent[] = getPendingEvents(world).slice(beforeLength)
      const newWorkEvents: QueuedGameEvent[] = newEvents.filter(
        (event: QueuedGameEvent) => event.type === 'work',
      )

      expect(newWorkEvents.length).toBeLessThanOrEqual(1)

      if (newWorkEvents.length === 1) {
        workEventDays.push(dayIndex + 1)
      }
    }

    expect(workEventDays).toEqual([1, 2, 3, 4])
    expect(
      getPendingEvents(world)
        .filter((event: QueuedGameEvent) => event.type === 'work')
        .map((event: QueuedGameEvent) => event.id),
    ).toEqual(['deadline_push', 'colleague_help', 'tech_issues', 'mid_month_raise'])
  })

  it('T032 month crossings call processMonthlySettlementForWorld once per crossing', () => {
    const world: GameWorld = createEmployedWorld()
    const hooks: DayEndHooks = createLiveDayEndHooks(createFakeRandomSource([1]))
    const originalProcessMonthlySettlementForWorld:
      typeof mutationsModule.processMonthlySettlementForWorld = mutationsModule.processMonthlySettlementForWorld
    let settlementCount: number = 0
    const settlementSpy: MockInstance = vi.spyOn(mutationsModule, 'processMonthlySettlementForWorld').mockImplementation(
      (targetWorld: GameWorld): void => {
        settlementCount += 1
        originalProcessMonthlySettlementForWorld(targetWorld)
      },
    )

    world.finance.expenseList = []
    world.events.state.cooldownByEventId.micro_minor_injury = 999

    for (let dayIndex: number = 0; dayIndex < 60; dayIndex += 1) {
      planDayCommand(world, { sleepHours: 7, workHours: 0, actionIds: [] }, hooks)
    }

    expect(settlementCount).toBe(2)
    expect(settlementSpy).toHaveBeenCalledTimes(2)
    expect(world.finance.lastMonthlySettlement).not.toBeNull()

    settlementSpy.mockRestore()
  })
})
