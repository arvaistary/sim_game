import { describe, expect, test } from 'vitest'
import {
  EDUCATION_LONG_PROGRAM_STEP_HOURS,
  resolveStudySessionHours,
} from '@/domain/engine/systems/EducationSystem/cognitive-load'

describe('Education cognitive load helpers', () => {
  test('uses the default long session for regular modules', () => {
    expect(resolveStudySessionHours(8)).toBe(EDUCATION_LONG_PROGRAM_STEP_HOURS)
    expect(resolveStudySessionHours(4)).toBe(EDUCATION_LONG_PROGRAM_STEP_HOURS)
  })

  test('shrinks the session for the short tail of a module', () => {
    expect(resolveStudySessionHours(1)).toBe(1)
    expect(resolveStudySessionHours(2.5)).toBe(2.5)
  })
})
