import { describe, expect, it } from 'vitest'

import type { SkillDef } from '@/domain/balance/types'
import { ALL_SKILLS, MAX_SKILL_LEVEL } from '@/domain/balance/constants/skills-constants'

describe('skills constants', () => {
  it('caps the skill level at 10', () => {
    expect(MAX_SKILL_LEVEL).toBe(10)
  })

  it('declares the same maximum level on every skill definition', () => {
    const skills: SkillDef[] = ALL_SKILLS

    expect(skills.length).toBeGreaterThan(0)

    for (const skill of skills) {
      expect(skill.maxLevel, skill.key).toBe(10)
    }
  })
})
