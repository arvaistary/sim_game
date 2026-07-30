import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  executeActionCommand,
  resolveEventDecisionCommand,
  simulateWorkShiftCommand,
} from '@/domain/game-world/commands'
import type {
  ExecuteActionResult,
  GameEventPayload,
  ResolveEventResult,
  WorkShiftResult,
} from '@/domain/game-world/commands/commands.types'

describe('domain command: executeActionCommand', () => {
  it('возвращает not_found для несуществующего actionId', () => {
    const world: GameWorld = GameWorld.createEmpty()

    const result: ExecuteActionResult = executeActionCommand(world, 'definitely-unknown-action-id')

    expect(result.success).toBe(false)
    expect(result.message).toContain('не найден')
  })

  it('отклоняет действие при нехватке денег', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 10, totalEarnings: 10, totalSpent: 0 } })
    const actionId: string = 'self_public_speaking' // имеет price > 0

    const result: ExecuteActionResult = executeActionCommand(world, actionId)

    expect(result.success).toBe(false)
    expect(result.message).toContain('денег')
  })

  it('отклоняет действие при нехватке недельного времени (деньги есть)', () => {
    const world: GameWorld = GameWorld.createEmpty({
      wallet: { money: 1_000_000, totalEarnings: 1_000_000, totalSpent: 0 },
      time: {
        totalHours: 0,
        dayHoursSpent: 0,
        dayHoursRemaining: 24,
        weekHoursSpent: 168,
        weekHoursRemaining: 0,
        hourOfDay: 0,
        sleepDebt: 0,
      },
    })
    const actionId: string = 'self_public_speaking'

    const result: ExecuteActionResult = executeActionCommand(world, actionId)

    expect(result.success).toBe(false)
    expect(result.message).toContain('времени')
  })

  it('применяет бесплатное action корректно (деньги/время/статы)', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const moneyBefore: number = world.wallet.money
    const hoursBefore: number = world.time.weekHoursRemaining
    const actionId: string = 'self_morning_routine' // price: 0, hourCost: 1

    const result: ExecuteActionResult = executeActionCommand(world, actionId)

    expect(result.success).toBe(true)
    expect(world.wallet.money).toBe(moneyBefore) // бесплатное
    expect(world.time.weekHoursRemaining).toBeLessThan(hoursBefore) // время списано
    expect(world.activity.entries.length).toBeGreaterThan(0)
    expect(world.stats.energy).toBeGreaterThanOrEqual(0)
    expect(world.stats.energy).toBeLessThanOrEqual(100)
    expect(world.activity.lifetime).toBeDefined()
  })

  it('открывает медитацию только после завершения книги', () => {
    const world: GameWorld = GameWorld.createEmpty()

    expect(executeActionCommand(world, 'self_meditation_practice')).toEqual(
      expect.objectContaining({ success: false, message: 'Сначала завершите книгу «Основы медитации»' }),
    )

    world.education.completedPrograms = [{
      id: 'meditation_foundations_book',
      name: 'Книга «Основы медитации»',
      completedAtGameDay: 0,
    }]

    expect(executeActionCommand(world, 'self_meditation_practice')).toEqual(
      expect.objectContaining({ success: true }),
    )
  })

  it('сохраняет usage action в мире и после сериализации', () => {
    const world: GameWorld = GameWorld.createEmpty()

    expect(world.actionUsage.self_morning_routine).toBeUndefined()
    expect(executeActionCommand(world, 'self_morning_routine').success).toBe(true)
    expect(executeActionCommand(world, 'self_morning_routine').success).toBe(true)

    expect(world.actionUsage.self_morning_routine).toEqual({ count: 2, lastUsedAt: 2 })
    expect(GameWorld.fromJSON(world.toJSON()).actionUsage.self_morning_routine).toEqual({ count: 2, lastUsedAt: 2 })
  })

  it('списывает деньги и пишет activity entry для платного action', () => {
    const initialMoney: number = 1_000_000
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: initialMoney, totalEarnings: initialMoney, totalSpent: 0 } })
    const moneyBefore: number = world.wallet.money
    const actionId: string = 'self_public_speaking'

    const result: ExecuteActionResult = executeActionCommand(world, actionId)

    expect(result.success).toBe(true)
    expect(world.wallet.money).toBeLessThan(moneyBefore)
    expect(world.wallet.totalSpent).toBeGreaterThan(0)
    expect(world.activity.entries.some((e) => e.type === 'action')).toBe(true)
  })
})

describe('domain command: simulateWorkShiftCommand', () => {
  it('отклоняет смену, если игрок не трудоустроен', () => {
    const world: GameWorld = GameWorld.createEmpty() // currentJob.employed = false по умолчанию

    const result: WorkShiftResult = simulateWorkShiftCommand(world, 8)

    expect(result.success).toBe(false)
    expect(result.message).toContain('работ')
    expect(result.earnedAmount).toBe(0)
  })

  it('начисляет зарплату, тратит время и пишет activity entry', () => {
    const world: GameWorld = GameWorld.createEmpty({
      career: {
        currentJob: {
          id: 'junior-dev',
          name: 'Junior Developer',
          schedule: '5/2',
          employed: true,
          salaryPerHour: 500,
          salaryPerWeek: 0,
          salaryPerDay: 0,
          requiredHoursPerWeek: 40,
          workedHoursCurrentWeek: 0,
          pendingSalaryWeek: 0,
          totalWorkedHours: 0,
          level: 0,
          daysAtWork: 0,
        },
        jobHistory: [],
        careerLevel: 0,
        promotions: 0,
      },
    })
    const moneyBefore: number = world.wallet.money
    const hoursBefore: number = world.time.weekHoursRemaining

    const result: WorkShiftResult = simulateWorkShiftCommand(world, 8)

    expect(result.success).toBe(true)
    expect(result.earnedAmount).toBe(8 * 500) // base, без skill boost
    expect(world.wallet.money).toBe(moneyBefore + result.earnedAmount)
    expect(world.time.weekHoursRemaining).toBe(hoursBefore - 8)
    expect(world.career.currentJob.workedHoursCurrentWeek).toBe(8)
    expect(world.activity.entries.some((e) => e.type === 'work')).toBe(true)
    expect(world.activity.lifetime.totalWorkHours).toBe(8)
  })

  it('применяет skillModifiers.salaryMultiplier к зарплате', () => {
    const world: GameWorld = GameWorld.createEmpty({
      career: {
        currentJob: {
          id: 'junior-dev',
          name: 'Junior Developer',
          schedule: '5/2',
          employed: true,
          salaryPerHour: 500,
          salaryPerWeek: 0,
          salaryPerDay: 0,
          requiredHoursPerWeek: 40,
          workedHoursCurrentWeek: 0,
          pendingSalaryWeek: 0,
          totalWorkedHours: 0,
          level: 0,
          daysAtWork: 0,
        },
        jobHistory: [],
        careerLevel: 0,
        promotions: 0,
      },
      skills: {
        levels: {},
        modifiers: {
          salaryMultiplier: 2,
          energyDrainMultiplier: 1,
          hungerDrainMultiplier: 1,
          stressGainMultiplier: 1,
          moodRecoveryMultiplier: 1,
          healthDecayMultiplier: 1,
        },
      },
    })

    const result: WorkShiftResult = simulateWorkShiftCommand(world, 8)

    expect(result.success).toBe(true)
    expect(result.earnedAmount).toBe(8 * 500 * 2)
  })
})

describe('domain command: resolveEventDecisionCommand', () => {
  const sampleEvent: GameEventPayload = {
    id: 'ev_test',
    title: 'Тестовое событие',
    choices: [
      { id: 'choice_a', text: 'Вариант А', effects: { mood: +10 }, outcome: 'Хорошо' },
      { id: 'choice_b', text: 'Вариант B', effects: { stress: +20 }, outcome: 'Плохо' },
    ],
  }

  it('возвращает no_event если event=null', () => {
    const world: GameWorld = GameWorld.createEmpty()

    const result: ResolveEventResult = resolveEventDecisionCommand(world, null, 'choice_a')

    expect(result.success).toBe(false)
    expect(result.message).toContain('события')
  })

  it('возвращает choice_not_found для несуществующего choiceId', () => {
    const world: GameWorld = GameWorld.createEmpty()

    const result: ResolveEventResult = resolveEventDecisionCommand(world, sampleEvent, 'unknown_choice')

    expect(result.success).toBe(false)
    expect(result.message.toLowerCase()).toContain('выбор')
  })

  it('применяет effects выбранного варианта и пишет activity entry', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const moodBefore: number = world.stats.mood

    const result: ResolveEventResult = resolveEventDecisionCommand(world, sampleEvent, 'choice_a')

    expect(result.success).toBe(true)
    expect(result.choiceText).toBe('Вариант А')
    expect(result.outcome).toBe('Хорошо')
    expect(world.stats.mood).toBe(moodBefore + 10)
    expect(world.activity.entries.some((e) => e.type === 'event')).toBe(true)
    expect(world.activity.lifetime.totalEvents).toBe(1)
  })

  it('корректно обрабатывает choice без effects', () => {
    const eventNoEffects: GameEventPayload = {
      id: 'ev_no_effects',
      title: 'Без effects',
      choices: [{ id: 'only_text', text: 'Просто текст', outcome: 'Ок' }],
    }
    const world: GameWorld = GameWorld.createEmpty()

    const result: ResolveEventResult = resolveEventDecisionCommand(world, eventNoEffects, 'only_text')

    expect(result.success).toBe(true)
  })
})
