import { describe, expect, it, vi } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import { advanceHours, executeActionCommand, planDayCommand, simulateWorkShiftCommand } from '@/domain/game-world/commands'
import type { DayEndHooks, DayPlanInput, DayPlanResult } from '@/domain/game-world/commands'

function employedWorld(totalHours: number = 0): GameWorld {
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
    const world: GameWorld = employedWorld()
    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] })

    expect(result.success).toBe(true)
    expect(result.plannedHours).toBe(17)
    expect(result.idleHours).toBe(7)
    expect(result.totalHoursSpent).toBe(24)
    expect(result.steps.map(step => step.kind)).toEqual(['sleep', 'work', 'action', 'idle'])
    expect(world.time.totalHours).toBe(24)
    expect(result.moneyDelta).toBe(80)
  })

  it('does not add sleep debt for neutral idle hours', () => {
    const world: GameWorld = employedWorld()

    planDayCommand(world, { sleepHours: 7, actionIds: [] })

    expect(world.time.sleepDebt).toBe(0)
  })

  it('allows a day without sleep', () => {
    const world: GameWorld = employedWorld()

    const result: DayPlanResult = planDayCommand(world, { sleepHours: 0, actionIds: [] })

    expect(result.success).toBe(true)
    expect(result.steps.map(step => step.kind)).toEqual(['idle'])
    expect(result.totalHoursSpent).toBe(24)
  })

  it('matches sequential domain commands for money and stats', () => {
    const plannedWorld: GameWorld = employedWorld()
    const sequentialWorld: GameWorld = employedWorld()
    const plan: DayPlanInput = { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] }

    const result: DayPlanResult = planDayCommand(plannedWorld, plan)
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
    const world: GameWorld = employedWorld()
    world.wallet.money = 0
    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, workHours: 0, actionIds: ['fun_cinema'] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('День выполнен частично')
    expect(result.steps.find(step => step.actionId === 'fun_cinema')).toMatchObject({ success: false, hoursSpent: 0 })
    expect(result.idleHours).toBe(17)
    expect(world.time.totalHours).toBe(24)
  })

  it('rejects plans that exceed remaining day hours without side effects', () => {
    const world: GameWorld = employedWorld()
    const before: GameWorldJSON = world.toJSON()
    const result: DayPlanResult = planDayCommand(world, {
      sleepHours: 7,
      actionIds: ['fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk', 'fun_park_walk'],
    })

    expect(result.success).toBe(false)
    expect(result.message).toBe('План превышает оставшееся время дня')
    expect(result.steps).toEqual([])
    expect(world.toJSON()).toEqual(before)
  })

  it('rejects unsupported sleep and overlong plans without side effects', () => {
    const world: GameWorld = employedWorld()
    const before: GameWorldJSON = world.toJSON()

    expect(planDayCommand(world, { sleepHours: 6, actionIds: [] }).success).toBe(false)
    expect(planDayCommand(world, { sleepHours: 10, workHours: 15, actionIds: [] }).success).toBe(false)
    expect(world.toJSON()).toEqual(before)
  })

  it('blocks a period when energy or health is zero', () => {
    const energyWorld: GameWorld = employedWorld()
    energyWorld.stats.energy = 0
    const energyResult: DayPlanResult = planDayCommand(energyWorld, { sleepHours: 7, actionIds: [] })

    expect(energyResult.success).toBe(false)
    expect(energyResult.message).toBe('Нельзя прожить период: энергия достигла нуля')
    expect(energyResult.steps).toEqual([])

    const healthWorld: GameWorld = employedWorld()
    healthWorld.stats.health = 0
    const healthResult: DayPlanResult = planDayCommand(healthWorld, { sleepHours: 7, actionIds: [] })

    expect(healthResult.success).toBe(false)
    expect(healthResult.message).toBe('Нельзя прожить период: здоровье достигло нуля')
    expect(healthResult.steps).toEqual([])
  })

  it('blocks a period at -150 on non-critical displayed scales', () => {
    const allowedWorld: GameWorld = employedWorld()
    allowedWorld.stats.mood = -149
    expect(planDayCommand(allowedWorld, { sleepHours: 7, actionIds: [] }).success).toBe(true)

    const moodWorld: GameWorld = employedWorld()
    moodWorld.stats.mood = -150
    const moodResult: DayPlanResult = planDayCommand(moodWorld, { sleepHours: 7, actionIds: [] })

    expect(moodResult.success).toBe(false)
    expect(moodResult.message).toBe('Нельзя прожить период: шкала «настроение» достигла критического дефицита')

    const physicalWorld: GameWorld = employedWorld()
    physicalWorld.stats.physical = -150
    expect(planDayCommand(physicalWorld, { sleepHours: 7, actionIds: [] }).success).toBe(false)

    const hungerWorld: GameWorld = employedWorld()
    hungerWorld.stats.hunger = 250
    expect(planDayCommand(hungerWorld, { sleepHours: 7, actionIds: [] }).success).toBe(false)

    const stressWorld: GameWorld = employedWorld()
    stressWorld.stats.stress = 250
    expect(planDayCommand(stressWorld, { sleepHours: 7, actionIds: [] }).success).toBe(false)
  })

  it('rejects sleep and work actions in free-action slots', () => {
    const world: GameWorld = employedWorld()
    const before: GameWorldJSON = world.toJSON()

    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, actionIds: ['fun_sleep_normal'] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('План содержит недопустимое свободное действие')
    expect(world.toJSON()).toEqual(before)
  })

  it('skips work when employment disappears before confirmation', () => {
    const world: GameWorld = employedWorld()
    world.career.currentJob.employed = false
    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, workHours: 8, actionIds: [] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('День выполнен частично')
    expect(result.steps.find(step => step.kind === 'work')).toMatchObject({ success: false, hoursSpent: 0 })
    expect(result.idleHours).toBe(17)
  })

  it('fires boundary hooks after closing day', () => {
    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }
    const world: GameWorld = employedWorld(160)
    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, actionIds: [] }, hooks)

    expect(hooks.onDayEnd).toHaveBeenCalledOnce()
    expect(hooks.onDayEnd).toHaveBeenCalledWith(world, result)
    expect(hooks.onWeekEnd).toHaveBeenCalledOnce()
  })

  it('fires month/year/age hooks at calendar boundaries', () => {
    const monthHooks: DayEndHooks = { onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn() }
    const monthWorld: GameWorld = employedWorld(29 * 24)
    planDayCommand(monthWorld, { sleepHours: 7, actionIds: [] }, monthHooks)
    expect(monthHooks.onMonthEnd).toHaveBeenCalledOnce()

    const yearHooks: DayEndHooks = { onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn() }
    const yearWorld: GameWorld = employedWorld(364 * 24)
    planDayCommand(yearWorld, { sleepHours: 7, actionIds: [] }, yearHooks)
    expect(yearHooks.onYearEnd).toHaveBeenCalledOnce()
    expect(yearHooks.onAgeChanged).toHaveBeenCalledOnce()
    expect(yearHooks.onAgeChanged).toHaveBeenCalledWith(yearWorld, { previousAge: 18, currentAge: 19 })
    expect(yearWorld.player.currentAge).toBe(19)
  })

  it('fires each boundary hook once per crossed boundary', () => {
    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }
    const weekWorld: GameWorld = employedWorld(6 * 24)
    const monthWorld: GameWorld = employedWorld(29 * 24)
    const yearWorld: GameWorld = employedWorld(364 * 24)

    planDayCommand(weekWorld, { sleepHours: 7, actionIds: [] }, hooks)
    planDayCommand(weekWorld, { sleepHours: 7, actionIds: [] }, hooks)
    planDayCommand(monthWorld, { sleepHours: 7, actionIds: [] }, hooks)
    planDayCommand(monthWorld, { sleepHours: 7, actionIds: [] }, hooks)
    planDayCommand(yearWorld, { sleepHours: 7, actionIds: [] }, hooks)
    planDayCommand(yearWorld, { sleepHours: 7, actionIds: [] }, hooks)

    expect(hooks.onDayEnd).toHaveBeenCalledTimes(6)
    expect(hooks.onWeekEnd).toHaveBeenCalledTimes(1)
    expect(hooks.onMonthEnd).toHaveBeenCalledTimes(1)
    expect(hooks.onYearEnd).toHaveBeenCalledTimes(1)
    expect(hooks.onAgeChanged).toHaveBeenCalledTimes(1)
  })

  it('does not increment age again after a year boundary has already passed', () => {
    const world: GameWorld = employedWorld(365 * 24)

    planDayCommand(world, { sleepHours: 7, actionIds: [] })
    expect(world.player.currentAge).toBe(19)

    planDayCommand(world, { sleepHours: 7, actionIds: [] })
    expect(world.player.currentAge).toBe(19)
  })
})
