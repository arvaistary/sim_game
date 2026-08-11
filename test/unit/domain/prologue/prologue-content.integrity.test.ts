import { describe, expect, test } from 'vitest'
import { PROLOGUE_SCENE_POOL } from '@/domain/balance/constants/prologue/scene-pool-config'
import { getChildhoodEventById } from '@/domain/balance/constants/childhood-events'
import { SCHOOL_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-school'
import { TECH_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-tech'
import { UNI_EXAM_QUESTIONS } from '@/domain/balance/constants/prologue/exam-questions-uni'
import { storeLevelToCareerRank } from '@/domain/balance/utils/education-ranks'

describe('prologue content integrity', () => {
  test('every mapped scene has matching childhood choice count', () => {
    for (const entry of PROLOGUE_SCENE_POOL) {
      const event = getChildhoodEventById(entry.eventId)
      expect(event, entry.eventId).toBeDefined()
      expect(entry.choices.length, entry.eventId).toBe(event!.choices.length)
    }
  })

  test('exam banks have valid correctIndex and min sizes', () => {
    expect(SCHOOL_EXAM_QUESTIONS.length).toBeGreaterThanOrEqual(20)
    expect(TECH_EXAM_QUESTIONS.length).toBeGreaterThanOrEqual(16)
    expect(UNI_EXAM_QUESTIONS.length).toBeGreaterThanOrEqual(16)

    for (const question of [...SCHOOL_EXAM_QUESTIONS, ...TECH_EXAM_QUESTIONS, ...UNI_EXAM_QUESTIONS]) {
      expect(question.options).toHaveLength(3)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.correctIndex).toBeLessThanOrEqual(2)
      expect(question.options[question.correctIndex]).toBeTruthy()
    }
  })

  test('tech/uni education keys map to sensible career ranks', () => {
    expect(storeLevelToCareerRank('college')).toBe(0)
    expect(storeLevelToCareerRank('bachelor')).toBe(1)
    expect(storeLevelToCareerRank('bachelor')).toBeGreaterThan(storeLevelToCareerRank('college'))
  })
})
