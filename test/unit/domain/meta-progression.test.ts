import { describe, expect, it } from 'vitest'
import {
  cloneMetaProgression,
  consumeNewGamePlusTransfer,
  createInitialMetaProgression,
  normalizeMetaProgression,
  recordCompletedLife,
} from '@/domain/meta-progression'
import type { LifeSummary } from '@/domain/game-world/life'
import type { MetaProgression, NewGamePlusTransfer } from '@/domain/meta-progression'

function summary(): LifeSummary {
  return {
    playerName: 'Тест',
    ageAtDeath: 80,
    gameDays: 1000,
    gameHours: 24000,
    deathCause: 'natural_old_age',
    deathCauseLabel: 'Естественная смерть',
    endingType: 'ordinary_life',
    endingTitle: 'Обычная жизнь',
    score: { total: 12, stars: 3, criteria: { age: 3, money: 2, comfort: 2, skills: 2, family: 2, achievements: 1 } },
    finance: { moneyAtDeath: 10000, maxMoney: 20000, totalEarnings: 50000, totalSpent: 40000 },
    career: { highestJob: 'Тестер', maxSalaryPerWeek: 20000, promotions: 2, totalWorkDays: 100, totalWorkHours: 800, careerLevel: 2 },
    topSkills: [{ id: 'logic', level: 8 }, { id: 'writing', level: 5 }, { id: 'music', level: 3 }],
    family: { relationshipCount: 0, childrenCount: 0, marriages: 0, maxRelationshipLevel: 0 },
    housing: { maxLevel: 1, comfortAtDeath: 40 },
    possessions: 0,
    achievements: 0,
    hobbies: { mastered: 0, maxLevel: 0, collections: 0 },
  }
}

describe('meta-progression', () => {
  it('creates and normalizes a safe default state', () => {
    const normalized: MetaProgression = normalizeMetaProgression({
      livesCompleted: -2,
      totalGameHours: Number.NaN,
      deathCauseCounts: { illness: 3, unknown: 99 },
      unlockedAchievements: ['first', 'first', 1],
      pendingTransfer: { money: 250, skills: { logic: 4, invalid: -1 } },
    })

    expect(normalized.livesCompleted).toBe(0)
    expect(normalized.totalGameHours).toBe(0)
    expect(normalized.deathCauseCounts).toEqual({
      natural_old_age: 0,
      illness: 3,
      accident: 0,
      depression: 0,
      exhaustion: 0,
    })
    expect(normalized.unlockedAchievements).toEqual(['first'])
    expect(normalized.pendingTransfer).toEqual({ money: 250, skills: { logic: 4 } })
  })

  it('records one completed life and prepares the default New Game+ transfer', () => {
    const meta: MetaProgression = createInitialMetaProgression()
    recordCompletedLife(meta, summary(), 7)

    expect(meta.livesCompleted).toBe(1)
    expect(meta.totalGameDays).toBe(1000)
    expect(meta.totalGameHours).toBe(24000)
    expect(meta.totalEarnings).toBe(50000)
    expect(meta.totalWorkHours).toBe(800)
    expect(meta.totalEvents).toBe(7)
    expect(meta.bestAge).toBe(80)
    expect(meta.bestScore).toBe(12)
    expect(meta.deathCauseCounts.natural_old_age).toBe(1)
    expect(meta.bestSkillLevels).toEqual({ logic: 8, writing: 5, music: 3 })
    expect(meta.pendingTransfer).toEqual({ money: 1500, skills: { logic: 4, writing: 2 } })
  })

  it('consumes transfer once and preserves the rest of meta state', () => {
    const meta: MetaProgression = createInitialMetaProgression()
    recordCompletedLife(meta, summary(), 0)
    meta.unlockedAchievements.push('first')

    const transfer: NewGamePlusTransfer = consumeNewGamePlusTransfer(meta)

    expect(transfer).toEqual({ money: 1500, skills: { logic: 4, writing: 2 } })
    expect(meta.newGamePlusCount).toBe(1)
    expect(meta.pendingTransfer).toEqual({ money: 0, skills: {} })
    expect(meta.unlockedAchievements).toEqual(['first'])
    expect(cloneMetaProgression(meta)).toEqual(meta)
  })
})
