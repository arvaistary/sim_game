import { describe, expect, it } from 'vitest'

import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  createCalendarPlan,
  forecastCalendarPlan,
  getCalendarHorizon,
  getCalendarLockCopy,
  getCalendarUnlockLevel,
  getScheduledWorkHours,
  runCalendarPlan,
  validateCalendarAction,
} from '@/domain/game-world/calendar'
import type { CalendarLockCopy, CalendarPlan, CalendarRunResult, CalendarValidationResult } from '@/domain/game-world/calendar'

describe('calendar horizon', () => {
  it('opens the planned day steps from time-management skill', () => {
    expect(getCalendarHorizon(0)).toBe(1)
    expect(getCalendarHorizon(2)).toBe(2)
    expect(getCalendarHorizon(6)).toBe(5)
    expect(getCalendarHorizon(10)).toBe(7)
    expect(getCalendarUnlockLevel(0)).toBe(0)
    expect(getCalendarUnlockLevel(3)).toBe(6)
    expect(getCalendarUnlockLevel(6)).toBe(8)
  })

  it('names the time-management skill instead of a character level', () => {
    const copy: CalendarLockCopy = getCalendarLockCopy({
      skillLabel: 'Тайм-менеджмент',
      unlockLevel: 2,
      currentLevel: 0,
    })

    expect(copy.title).toBe('День закрыт')
    expect(copy.requirement).toBe('Нужен навык «Тайм-менеджмент» 2')
    expect(copy.progress).toBe('Сейчас: 0')
    expect(copy.requirement).not.toContain('на уровне')
  })
})

describe('calendar run and forecast', () => {
  it('runs several saved day plans through the day command', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const plan: CalendarPlan = createCalendarPlan(2)

    const result: CalendarRunResult = runCalendarPlan(world, plan)

    expect(result.success).toBe(true)
    expect(result.completedDays).toBe(2)
    expect(world.time.totalHours).toBe(48)
  })

  it('does not mutate the world while forecasting', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const before: number = world.time.totalHours
    const plan: CalendarPlan = createCalendarPlan(1)

    const result: CalendarRunResult = forecastCalendarPlan(world, plan)

    expect(result.success).toBe(true)
    expect(result.days[0]?.result.totalHoursSpent).toBe(24)
    expect(world.time.totalHours).toBe(before)
  })

  it('executes pinned actions again after the day advances', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const plan: CalendarPlan = createCalendarPlan(2)
    plan.days[0]!.actionIds = ['fun_park_walk']
    plan.days[0]!.pinnedActionIndexes = [0]

    const result: CalendarRunResult = forecastCalendarPlan(world, plan)

    expect(result.success).toBe(true)
    expect(result.days[1]?.result.steps.some(step => step.actionId === 'fun_park_walk')).toBe(true)
  })

  it('derives automatic work shifts from a cyclic job schedule', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.career.currentJob = {
      ...world.career.currentJob,
      employed: true,
      schedule: '5/2',
      salaryPerHour: 100,
      salaryPerDay: 800,
    }

    expect(getScheduledWorkHours(world, 0)).toBe(8)
    expect(getScheduledWorkHours(world, 4)).toBe(8)
    expect(getScheduledWorkHours(world, 5)).toBe(0)
    expect(getScheduledWorkHours(world, 6)).toBe(0)
  })

  it('rejects a card that exceeds the day budget before it is added', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const plan: CalendarPlan = createCalendarPlan(1)
    plan.days[0]!.actionIds = Array.from({ length: 8 }, () => 'fun_park_walk')

    const result: CalendarValidationResult = validateCalendarAction(world, plan, 0, 'fun_park_walk')

    expect(result).toEqual({ success: false, message: 'План превышает оставшееся время дня' })
  })
})
