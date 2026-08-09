import { describe, expect, it } from 'vitest'

import type { GameEventPayload, ResolveEventResult } from '@/domain/game-world/commands'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { resolveEventDecisionCommand, setSkillLevel } from '@/domain/game-world/commands'

function createEmployedWorld(): GameWorld {
  const world: GameWorld = GameWorld.createEmpty({
    wallet: { money: 1_000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    career: {
      currentJob: {
        id: 'job',
        name: 'Job',
        schedule: '5/2',
        employed: true,
        salaryPerHour: 100,
        salaryPerWeek: 4_000,
        salaryPerDay: 800,
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

describe('resolveEventDecisionCommand canonical behavior', () => {
  it('applies statChanges', () => {
    const world: GameWorld = createEmployedWorld()
    const energyBefore: number = world.stats.energy
    const stressBefore: number = world.stats.stress
    const event: GameEventPayload = {
      id: 'event_stats',
      title: 'Статы',
      choices: [
        {
          id: 'rest',
          text: 'Отдохнуть',
          statChanges: { energy: 5, stress: -3 },
        },
      ],
    }

    const result: ResolveEventResult = resolveEventDecisionCommand(world, event, 'rest')

    expect(result.success).toBe(true)
    expect(world.stats.energy).toBe(energyBefore + 5)
    expect(world.stats.stress).toBe(stressBefore - 3)
  })

  it('applies moneyDelta', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'event_money',
      title: 'Деньги',
      choices: [
        {
          id: 'bonus',
          text: 'Взять бонус',
          moneyDelta: 250,
        },
      ],
    }

    resolveEventDecisionCommand(world, event, 'bonus')

    expect(world.wallet.money).toBe(1_250)
  })

  it('applies skillChanges as skill XP', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'event_skill',
      title: 'Навык',
      choices: [
        {
          id: 'learn',
          text: 'Учиться',
          skillChanges: { programming: 250 },
        },
      ],
    }

    resolveEventDecisionCommand(world, event, 'learn')

    expect(world.skills.levels.programming).toEqual({ level: 2.5, xp: 250 })
  })

  it('applies skillCheck success branches', () => {
    const world: GameWorld = createEmployedWorld()
    const moodBefore: number = world.stats.mood
    const stressBefore: number = world.stats.stress
    const event: GameEventPayload = {
      id: 'event_skill_check_success',
      title: 'Проверка навыка',
      choices: [
        {
          id: 'attempt',
          text: 'Попробовать',
          skillCheck: {
            key: 'charisma',
            threshold: 4,
            successStatChanges: { mood: 8, stress: -4 },
            failStatChanges: { mood: -5, stress: 6 },
            successMoneyDelta: 300,
            failMoneyDelta: -100,
          },
        },
      ],
    }

    setSkillLevel(world, 'charisma', 4)

    resolveEventDecisionCommand(world, event, 'attempt')

    expect(world.stats.mood).toBe(moodBefore + 8)
    expect(world.stats.stress).toBe(stressBefore - 4)
    expect(world.wallet.money).toBe(1_300)
  })

  it('applies skillCheck fail branches', () => {
    const world: GameWorld = createEmployedWorld()
    const moodBefore: number = world.stats.mood
    const stressBefore: number = world.stats.stress
    const event: GameEventPayload = {
      id: 'event_skill_check_fail',
      title: 'Проверка навыка',
      choices: [
        {
          id: 'attempt',
          text: 'Попробовать',
          skillCheck: {
            key: 'charisma',
            threshold: 4,
            successStatChanges: { mood: 8, stress: -4 },
            failStatChanges: { mood: -5, stress: 6 },
            successMoneyDelta: 300,
            failMoneyDelta: -100,
          },
        },
      ],
    }

    resolveEventDecisionCommand(world, event, 'attempt')

    expect(world.stats.mood).toBe(moodBefore - 5)
    expect(world.stats.stress).toBe(stressBefore + 6)
    expect(world.wallet.money).toBe(900)
  })

  it('applies salaryMultiplier using event earnedAmount', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'event_salary_bonus',
      title: 'Рабочий бонус',
      choices: [
        {
          id: 'push',
          text: 'Поднажать',
          salaryMultiplier: 0.5,
        },
      ],
      data: {
        earnedAmount: 333,
      },
    }

    resolveEventDecisionCommand(world, event, 'push')

    expect(world.wallet.money).toBe(1_167)
  })

  it('applies permanentSalaryMultiplier to current salaryPerHour', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'event_raise',
      title: 'Повышение ставки',
      choices: [
        {
          id: 'accept',
          text: 'Согласиться',
          permanentSalaryMultiplier: 0.2,
        },
      ],
    }

    resolveEventDecisionCommand(world, event, 'accept')

    expect(world.career.currentJob.salaryPerHour).toBe(120)
  })

  it('keeps deprecated effects support', () => {
    const world: GameWorld = createEmployedWorld()
    const healthBefore: number = world.stats.health
    const moodBefore: number = world.stats.mood
    const event: GameEventPayload = {
      id: 'event_legacy_effects',
      title: 'Legacy',
      choices: [
        {
          id: 'legacy',
          text: 'Старый вариант',
          effects: { health: -7, mood: 4 },
        },
      ],
    }

    resolveEventDecisionCommand(world, event, 'legacy')

    expect(world.stats.health).toBe(healthBefore - 7)
    expect(world.stats.mood).toBe(moodBefore + 4)
  })
})
