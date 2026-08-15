import { describe, expect, test } from 'vitest'
import { drawFromPool, createSeededRng } from '@/domain/prologue/scene-pool'
import { getScenePoolEntriesForStage } from '@/domain/balance/constants/prologue/scene-pool-config'
import { drawExamQuestions } from '@/domain/prologue/exam-bank'

describe('prologue scene pool', () => {
  test('meets minimum mapped volumes', () => {
    expect(getScenePoolEntriesForStage('infant').length).toBeGreaterThanOrEqual(8)
    expect(getScenePoolEntriesForStage('preschool').length).toBeGreaterThanOrEqual(12)
    expect(getScenePoolEntriesForStage('school').length).toBeGreaterThanOrEqual(16)
    expect(getScenePoolEntriesForStage('tech').length).toBeGreaterThanOrEqual(12)
    expect(getScenePoolEntriesForStage('uni').length).toBeGreaterThanOrEqual(12)
  })

  test('draw does not repeat within excludeIds', () => {
    const pool = getScenePoolEntriesForStage('school')
    const rng = createSeededRng(123)
    const excludeIds: string[] = []
    const drawn: string[] = []

    for (let index = 0; index < 8; index += 1) {
      const item = drawFromPool({
        items: pool,
        rng,
        excludeIds,
        getId: (entry) => entry.eventId,
      })
      expect(item).not.toBeNull()
      drawn.push(item!.eventId)
      excludeIds.push(item!.eventId)
    }

    expect(new Set(drawn).size).toBe(drawn.length)
  })
})

describe('prologue exam bank', () => {
  test('draws examQuestionCount without duplicates', () => {
    const questions = drawExamQuestions({ bankId: 'school', count: 5, seed: 1, salt: 2 })
    expect(questions.length).toBe(5)
    expect(new Set(questions.map((question) => question.id)).size).toBe(5)
  })
})
