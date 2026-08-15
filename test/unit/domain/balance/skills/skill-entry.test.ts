import { describe, expect, it } from 'vitest'

import type { SkillEntry } from '@/domain/balance/skills'
import { getXpForLevel, normalizeSkillLevels } from '@/domain/balance/skills'

describe('skill levels normalization', () => {
  it('converts a bare level number into an entry with experience', () => {
    const normalized: Record<string, SkillEntry> = normalizeSkillLevels({ cooking: 4 })

    expect(normalized.cooking).toEqual({ level: 4, xp: getXpForLevel(4) })
  })

  it('keeps an already normalized entry as is', () => {
    const normalized: Record<string, SkillEntry> = normalizeSkillLevels({ cooking: { level: 2, xp: 200 } })

    expect(normalized.cooking).toEqual({ level: 2, xp: 200 })
  })

  it('clamps a level outside the table', () => {
    const normalized: Record<string, SkillEntry> = normalizeSkillLevels({ cooking: 42, writing: -3 })

    expect(normalized.cooking.level).toBe(10)
    expect(normalized.writing.level).toBe(0)
  })

  it('returns an empty map for empty input', () => {
    expect(normalizeSkillLevels({})).toEqual({})
  })
})
