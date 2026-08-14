import { describe, expect, it } from 'vitest'

import { getXpForLevel } from '@/domain/balance/skills'
import type { SkillMigrationResult } from '@/infrastructure/persistence/save-skill-migration'
import {
  SKILL_SCHEMA_VERSION,
  migrateSkillXp,
  needsSkillMigration,
} from '@/infrastructure/persistence/save-skill-migration'

describe('skill save migration', () => {
  it('detects a save without the skill schema version', () => {
    expect(needsSkillMigration({})).toBe(true)
    expect(needsSkillMigration({ skillSchemaVersion: SKILL_SCHEMA_VERSION })).toBe(false)
  })

  it('rewrites legacy experience onto new thresholds', () => {
    const payload: Record<string, unknown> = {
      skills: { skills: { cooking: { level: 10, xp: 1000 }, writing: { level: 3, xp: 300 } } },
    }

    const result: SkillMigrationResult = migrateSkillXp(payload)
    const migrated: Record<string, { level: number; xp: number }> = (payload.skills as Record<string, unknown>).skills as Record<string, { level: number; xp: number }>

    expect(result.success).toBe(true)
    expect(result.migratedSkills).toBe(2)
    expect(migrated.cooking).toEqual({ level: 10, xp: getXpForLevel(10) })
    expect(migrated.writing).toEqual({ level: 3, xp: getXpForLevel(3) })
    expect(payload.skillSchemaVersion).toBe(SKILL_SCHEMA_VERSION)
  })

  it('rounds fractional levels and clamps out-of-range values', () => {
    const payload: Record<string, unknown> = {
      skills: { skills: { cooking: { level: 2.6, xp: 260 }, meditation: { level: 42, xp: 4200 } } },
    }

    migrateSkillXp(payload)

    const migrated: Record<string, { level: number; xp: number }> = (payload.skills as Record<string, unknown>).skills as Record<string, { level: number; xp: number }>

    expect(migrated.cooking.level).toBe(3)
    expect(migrated.meditation.level).toBe(10)
  })

  it('accepts a legacy numeric entry', () => {
    const payload: Record<string, unknown> = { skills: { skills: { cooking: 4 } } }

    migrateSkillXp(payload)

    const migrated: Record<string, { level: number; xp: number }> = (payload.skills as Record<string, unknown>).skills as Record<string, { level: number; xp: number }>

    expect(migrated.cooking).toEqual({ level: 4, xp: getXpForLevel(4) })
  })

  it('marks a save without skills as migrated without failing', () => {
    const payload: Record<string, unknown> = {}
    const result: SkillMigrationResult = migrateSkillXp(payload)

    expect(result.success).toBe(true)
    expect(result.migratedSkills).toBe(0)
    expect(payload.skillSchemaVersion).toBe(SKILL_SCHEMA_VERSION)
  })

  it('does not partially migrate or version a malformed skills bucket', () => {
    const payload: Record<string, unknown> = {
      skills: { skills: { cooking: { level: 4, xp: 700 }, writing: { invalid: true } } },
    }

    const result: SkillMigrationResult = migrateSkillXp(payload)

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(payload).toEqual({
      skills: { skills: { cooking: { level: 4, xp: 700 }, writing: { invalid: true } } },
    })
    expect(payload.skillSchemaVersion).toBeUndefined()
  })
})
