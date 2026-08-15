import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LEARNING_METHOD,
  LEARNING_METHOD_MULTIPLIERS,
  getLearningMethodMultiplier,
} from '@/domain/balance/skills/learning-methods'

describe('learning methods', () => {
  it('rewards a mentor more than solo practice and passive video', () => {
    expect(getLearningMethodMultiplier('mentor')).toBeGreaterThan(getLearningMethodMultiplier('practice'))
    expect(getLearningMethodMultiplier('practice')).toBeGreaterThan(getLearningMethodMultiplier('courses'))
    expect(getLearningMethodMultiplier('books')).toBeGreaterThan(getLearningMethodMultiplier('videos'))
  })

  it('falls back to deliberate practice when method is missing', () => {
    expect(DEFAULT_LEARNING_METHOD).toBe('practice')
    expect(getLearningMethodMultiplier(undefined)).toBe(LEARNING_METHOD_MULTIPLIERS.practice)
  })

  it('keeps routine work no faster than courses', () => {
    expect(getLearningMethodMultiplier('work')).toBeLessThanOrEqual(getLearningMethodMultiplier('courses'))
  })
})
