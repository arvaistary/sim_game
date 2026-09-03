import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  advanceLifeDay,
  buildLifeSummary,
  createInitialLifeState,
  evaluateDeathCause,
} from '@/domain/game-world/life'
import type {
  DeathCause,
  LifeDayContext,
  LifeState,
  LifeSummary,
} from '@/domain/game-world/life'

function context(overrides: Partial<LifeDayContext> = {}): LifeDayContext {
  return {
    currentAge: 50,
    health: 80,
    mood: 50,
    energy: 50,
    stress: 50,
    lowMoodDays: 0,
    ...overrides,
  }
}

describe('life rules', () => {
  it.each([
    ['illness', { health: 0 }],
    ['natural_old_age', { currentAge: 90, health: 50 }],
    ['natural_old_age', { currentAge: 75, health: 19 }],
    ['depression', { mood: 9, lowMoodDays: 30 }],
    ['exhaustion', { energy: 4, stress: 96 }],
  ] as Array<[DeathCause, Partial<LifeDayContext>]> )('detects %s', (cause: DeathCause, overrides: Partial<LifeDayContext>) => {
    expect(evaluateDeathCause(context(overrides))).toBe(cause)
  })

  it('prioritizes accident and illness when several causes match', () => {
    expect(evaluateDeathCause(context({ accidentTriggered: true, health: 0 }))).toBe('accident')
    expect(evaluateDeathCause(context({ health: 0, mood: 9, lowMoodDays: 30 }))).toBe('illness')
  })

  it('uses an inclusive 30-day depression threshold', () => {
    expect(evaluateDeathCause(context({ mood: 9, lowMoodDays: 29 }))).toBeNull()
    expect(evaluateDeathCause(context({ mood: 9, lowMoodDays: 30 }))).toBe('depression')
    expect(evaluateDeathCause(context({ mood: 9, lowMoodDays: 31 }))).toBe('depression')
  })

  it('counts consecutive low-mood days and resets the streak', () => {
    const initial: LifeState = createInitialLifeState()
    const first: LifeState = advanceLifeDay(initial, context({ mood: 9 }))
    const second: LifeState = advanceLifeDay(first, context({ mood: 9 }))
    const reset: LifeState = advanceLifeDay(second, context({ mood: 20 }))

    expect(first.lowMoodDays).toBe(1)
    expect(second.lowMoodDays).toBe(2)
    expect(reset.lowMoodDays).toBe(0)
    expect(reset.status).toBe('active')
  })

  it('does not replace an ended life', () => {
    const ended: LifeState = advanceLifeDay(
      advanceLifeDay(createInitialLifeState(), context({ health: 0 })),
      context({ accidentTriggered: true }),
    )

    expect(ended.status).toBe('ended')
    expect(ended.deathCause).toBe('illness')
  })
})

describe('life summary', () => {
  it('calculates score, ending type and top skills from the world', () => {
    const world: GameWorld = GameWorld.createEmpty({
      player: { playerName: 'Анна', startAge: 18, currentAge: 78 },
      time: { totalHours: 78 * 365 * 24, hourOfDay: 0, dayOfWeek: 1, weekHoursSpent: 0, weekHoursRemaining: 168, dayHoursSpent: 0, dayHoursRemaining: 24, sleepHoursToday: 0, sleepDebt: 0 },
      stats: { hunger: 10, energy: 70, stress: 20, mood: 80, health: 15, physical: 70 },
      wallet: { money: 2_000_000, totalEarnings: 10_000_000, totalSpent: 8_000_000, reserveFund: 100_000 },
      career: {
        currentJob: {
          id: 'director', name: 'Директор', schedule: '5/2', employed: true, salaryPerHour: 5000,
          salaryPerWeek: 200000, salaryPerDay: 40000, requiredHoursPerWeek: 40, workedHoursCurrentWeek: 40,
          pendingSalaryWeek: 0, totalWorkedHours: 10000, level: 5, daysAtWork: 1000,
        },
        jobHistory: [], careerLevel: 5, promotions: 8,
      },
      housing: { level: 3, name: 'Дом', comfort: 80, furniture: [], lastWeeklyBonus: null },
      skills: {
        levels: {
          a: { level: 7, xp: 0 }, b: { level: 8, xp: 0 }, c: { level: 9, xp: 0 }, d: { level: 7, xp: 0 }, e: { level: 7, xp: 0 },
        },
        modifiers: GameWorld.createEmpty().skills.modifiers,
      },
      relationships: [
        { id: 'partner', name: 'Партнёр', type: 'partner', level: 90, lastContact: 0 },
        { id: 'child', name: 'Ребёнок', type: 'child', level: 90, lastContact: 0 },
      ],
    })

    const summary: LifeSummary = buildLifeSummary(world, 'natural_old_age')

    expect(summary.endingType).toBe('happy_family')
    expect(summary.score.stars).toBe(4)
    expect(summary.topSkills).toHaveLength(5)
    expect(summary.family.childrenCount).toBe(1)
    expect(summary.achievements).toBe(0)
  })
})
