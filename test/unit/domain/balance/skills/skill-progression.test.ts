import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import type { SkillProgressionStep } from '@/domain/balance/skills/skill-progression'
import {
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  SKILL_XP_THRESHOLDS,
  getLevelFromXp,
  getSkillProgressionTable,
  getXpForLevel,
  getXpToNextLevel,
} from '@/domain/balance/skills/skill-progression'

describe('skill progression thresholds', () => {
  it('exposes one threshold per level including zero', () => {
    expect(SKILL_XP_THRESHOLDS.length).toBe(MAX_SKILL_LEVEL + 1)
    expect(SKILL_XP_THRESHOLDS[0]).toBe(0)
  })

  it('reaches the maximum level at 10000 experience', () => {
    expect(MAX_SKILL_XP).toBe(10000)
    expect(getLevelFromXp(10000)).toBe(MAX_SKILL_LEVEL)
  })

  it('places half of the whole path at level 8', () => {
    expect(getXpForLevel(8)).toBe(5000)
  })

  it('makes every next level cost more than the previous one', () => {
    const table: SkillProgressionStep[] = getSkillProgressionTable()

    for (let index: number = 1; index < table.length; index += 1) {
      const current: SkillProgressionStep = table[index]!
      const previous: SkillProgressionStep = table[index - 1]!

      expect(current.levelCost).toBeGreaterThan(previous.levelCost)
    }
  })

  it('gives the first level for 50 hours and stays at zero below it', () => {
    expect(getLevelFromXp(49)).toBe(0)
    expect(getLevelFromXp(50)).toBe(1)
  })

  it('clamps outside of the table', () => {
    expect(getLevelFromXp(-100)).toBe(0)
    expect(getLevelFromXp(999999)).toBe(MAX_SKILL_LEVEL)
    expect(getXpForLevel(50)).toBe(MAX_SKILL_XP)
    expect(getXpForLevel(-3)).toBe(0)
  })

  it('reports the remaining experience to the next level', () => {
    expect(getXpToNextLevel(50)).toBe(100)
    expect(getXpToNextLevel(MAX_SKILL_XP)).toBe(0)
  })

  it('does not keep a second experience table in the domain', () => {
    const retiredModules: string[] = [
      'src/domain/balance/utils/skill-system.ts',
      'src/domain/balance/utils/skill-system.types.ts',
      'src/domain/balance/utils/skill-system.example.ts',
      'src/domain/balance/utils/skill-ui-explainability.ts',
      'src/domain/balance/constants/skill-progression-config.ts',
    ]

    for (const relativePath of retiredModules) {
      expect(existsSync(resolve(process.cwd(), relativePath)), relativePath).toBe(false)
    }
  })
})
