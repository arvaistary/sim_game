import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'
import { telemetryReset, telemetryGetCounters } from '@/domain/engine/utils/telemetry'
import { setSkillProgressionConfig } from '@/domain/balance/constants/skill-progression-config'

describe('SkillsSystem shape handling', () => {
  function createSystem(): { world: ReturnType<typeof createWorldFromSave>; skills: SkillsSystem } {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const skills = new SkillsSystem()
    skills.init(world)
    return { world, skills }
  }

  beforeEach(() => {
    // Используем level-only модель для предсказуемых тестов
    setSkillProgressionConfig({
      activeModel: 'level-only',
      useTwoCircuitModel: false,
      enableDecay: false,
      enableBurnout: false,
      enableAgeMultipliers: false,
      enableChildhoodCaps: false
    })
  })

  test('applies skill changes to { level, xp } shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { testSkill: { level: 5, xp: 100 } })
    const result = skills.applySkillChanges({ testSkill: 2 }, 'test')
    expect(result.changed).toBe(true)
    const raw = world.getComponent('player', 'skills') as Record<string, unknown>
    const testSkill = raw?.testSkill as { level: number; xp: number } | undefined
    expect(testSkill?.level).toBe(7)
  })

  test('applies skill changes to legacy number shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { legacySkill: 3 })
    telemetryReset()
    const result = skills.applySkillChanges({ legacySkill: 2 }, 'test')
    expect(result.changed).toBe(true)
    expect(telemetryGetCounters()['skill_shape_fallback']).toBeGreaterThanOrEqual(1)
  })

  test('applies changes to { level, xp } component', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { cooking: { level: 7, xp: 200 } })
    const result = skills.applySkillChanges({ cooking: 1 }, 'test')
    expect(result.changed).toBe(true)
  })

  test('hasSkillLevel works with { level, xp } shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { coding: { level: 6, xp: 50 } })
    expect(skills.hasSkillLevel('coding', 5)).toBe(true)
    expect(skills.hasSkillLevel('coding', 7)).toBe(false)
  })

  test('hasSkillLevel works with number shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { fitness: 3 })
    expect(skills.hasSkillLevel('fitness', 3)).toBe(true)
    expect(skills.hasSkillLevel('fitness', 4)).toBe(false)
  })

  test('applySkillChanges handles { level, xp } shape correctly', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { music: { level: 2, xp: 30 } })
    const result = skills.applySkillChanges({ music: 3 }, 'test')
    expect(result.changed).toBe(true)
    const raw = world.getComponent('player', 'skills') as Record<string, unknown>
    const musicSkill = raw?.music as { level: number; xp: number }
    expect(musicSkill.level).toBe(5)
  })

  test('applySkillChanges converts number to { level, xp } shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { art: 2 })
    skills.applySkillChanges({ art: 1 }, 'test')
    const raw = world.getComponent('player', 'skills') as Record<string, unknown>
    const artSkill = raw?.art as { level: number; xp: number } | undefined
    expect(artSkill).toBeDefined()
    expect(artSkill?.level).toBe(3)
  })
})
