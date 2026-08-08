import { describe, expect, it, vi } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { advanceHours, executeActionCommand, planDayCommand, simulateWorkShiftCommand } from '@/domain/game-world/commands'
import type { DayEndHooks } from '@/domain/game-world/commands'

function employedWorld(totalHours = 0): GameWorld {
  return GameWorld.createEmpty({
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
    wallet: { money: 1000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    career: {
      currentJob: {
        id: 'job', name: 'Job', schedule: '5/2', employed: true, salaryPerHour: 10,
        salaryPerWeek: 400, salaryPerDay: 80, requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 0, pendingSalaryWeek: 0, totalWorkedHours: 0, level: 1, daysAtWork: 0,
      },
      jobHistory: [], careerLevel: 1, promotions: 0,
    },
  })
}

describe('planDayCommand', () => {
  it('executes planned steps, closes day and aggregates result', () => {
    const world = employedWorld()
    const result = planDayCommand(world, { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] })

    expect(result.success).toBe(true)
    expect(result.plannedHours).toBe(17)
    expect(result.idleHours).toBe(7)
    expect(result.totalHoursSpent).toBe(24)
    expect(result.steps.map(step => step.kind)).toEqual(['sleep', 'work', 'action', 'idle'])
    expect(world.time.totalHours).toBe(24)
    expect(result.moneyDelta).toBe(80)
  })

  it('does not add sleep debt for neutral idle hours', () => {
    const world = employedWorld()

    planDayCommand(world, { sleepHours: 7, actionIds: [] })

    expect(world.time.sleepDebt).toBe(0)
  })

  it('matches sequential domain commands for money and stats', () => {
    const plannedWorld = employedWorld()
    const sequentialWorld = employedWorld()
    const plan = { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] }

    const result = planDayCommand(plannedWorld, plan)
    executeActionCommand(sequentialWorld, 'fun_sleep_normal')
    simulateWorkShiftCommand(sequentialWorld, 8)
    executeActionCommand(sequentialWorld, 'fun_park_walk')
    advanceHours(sequentialWorld, sequentialWorld.time.dayHoursRemaining, 'idle')

    expect(result.success).toBe(true)
    expect(plannedWorld.wallet.money).toBe(sequentialWorld.wallet.money)
    expect(plannedWorld.stats).toEqual(sequentialWorld.stats)
    expect(plannedWorld.time.totalHours).toBe(sequentialWorld.time.totalHours)
  })

  it('skips unavailable actions and still closes day', () => {
    const world = employedWorld()
    world.wallet.money = 0
    const result = planDayCommand(world, { sleepHours: 7, workHours: 0, actionIds: ['fun_cinema'] })

    expect(result.success).toBe(true)
    expect(result.steps.find(step => step.actionId === 'fun_cinema')).toMatchObject({ success: false, hoursSpent: 0 })
    expect(result.idleHours).toBe(17)
    expect(world.time.totalHours).toBe(24)
  })

  it('rejects invalid plans without side effects', () => {
    const world = employedWorld()
    const before = world.toJSON()
    const result = planDayCommand(world, { sleepHours: 7, actionIds: ['fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk'] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Можно запланировать не более трёх действий')
    expect(result.steps).toEqual([])
    expect(world.toJSON()).toEqual(before)
  })

  it('rejects unsupported sleep and overlong plans without side effects', () => {
    const world = employedWorld()
    const before = world.toJSON()

    expect(planDayCommand(world, { sleepHours: 6, actionIds: [] }).success).toBe(false)
    expect(planDayCommand(world, { sleepHours: 10, workHours: 15, actionIds: [] }).success).toBe(false)
    expect(world.toJSON()).toEqual(before)
  })

  it('rejects sleep and work actions in free-action slots', () => {
    const world = employedWorld()
    const before = world.toJSON()

    const result = planDayCommand(world, { sleepHours: 7, actionIds: ['fun_sleep_normal'] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('План содержит недопустимое свободное действие')
    expect(world.toJSON()).toEqual(before)
  })

  it('skips work when employment disappears before confirmation', () => {
    const world = employedWorld()
    world.career.currentJob.employed = false
    const result = planDayCommand(world, { sleepHours: 7, workHours: 8, actionIds: [] })

    expect(result.success).toBe(true)
    expect(result.steps.find(step => step.kind === 'work')).toMatchObject({ success: false, hoursSpent: 0 })
    expect(result.idleHours).toBe(17)
  })

  it('fires boundary hooks after closing day', () => {
    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }
    const world = employedWorld(160)
    planDayCommand(world, { sleepHours: 7, actionIds: [] }, hooks)

    expect(hooks.onDayEnd).toHaveBeenCalledOnce()
    expect(hooks.onWeekEnd).toHaveBeenCalledOnce()
  })

  it('fires month/year/age hooks at calendar boundaries', () => {
    const monthHooks: DayEndHooks = { onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn() }
    const monthWorld = employedWorld(29 * 24)
    planDayCommand(monthWorld, { sleepHours: 7, actionIds: [] }, monthHooks)
    expect(monthHooks.onMonthEnd).toHaveBeenCalledOnce()

    const yearHooks: DayEndHooks = { onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn() }
    const yearWorld = employedWorld(364 * 24)
    planDayCommand(yearWorld, { sleepHours: 7, actionIds: [] }, yearHooks)
    expect(yearHooks.onYearEnd).toHaveBeenCalledOnce()
    expect(yearHooks.onAgeChanged).toHaveBeenCalledOnce()
    expect(yearWorld.player.currentAge).toBe(19)
  })

  it('does not increment age again after a year boundary has already passed', () => {
    const world = employedWorld(365 * 24)

    planDayCommand(world, { sleepHours: 7, actionIds: [] })
    expect(world.player.currentAge).toBe(19)

    planDayCommand(world, { sleepHours: 7, actionIds: [] })
    expect(world.player.currentAge).toBe(19)
  })
})
