import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'
import { telemetryReset, telemetryGetCounters } from '@/domain/engine/utils/telemetry'

describe('SkillsSystem shape handling', () => {
  function createSystem(): { world: ReturnType<typeof createWorldFromSave>; skills: SkillsSystem } {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const skills = new SkillsSystem()
    skills.init(world)
    return { world, skills }
  }

  test('getSkills returns flat { key: level } from { level, xp } shape', () => {
    const { world, skills } = createSystem()
    // Записываем навык в новом shape { level, xp }
    world.updateComponent('player', 'skills', { testSkill: { level: 5, xp: 100 } })
    const result = skills.getSkills()
    expect(result).toBeTruthy()
    expect(result?.testSkill).toBe(5)
  })

  test('getSkills returns flat { key: level } from legacy number shape', () => {
    const { world, skills } = createSystem()
    // Записываем навык в старом shape (number)
    world.updateComponent('player', 'skills', { legacySkill: 3 })
    telemetryReset()
    const result = skills.getSkills()
    expect(result).toBeTruthy()
    expect(result?.legacySkill).toBe(3)
    // Должен быть зафиксирован fallback
    expect(telemetryGetCounters()['skill_shape_fallback']).toBeGreaterThanOrEqual(1)
  })

  test('getSkillLevel extracts level from { level, xp } shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { cooking: { level: 7, xp: 200 } })
    expect(skills.getSkillLevel('cooking')).toBe(7)
  })

  test('getSkillLevel extracts level from number shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { reading: 4 })
    expect(skills.getSkillLevel('reading')).toBe(4)
  })

  test('getSkillLevel returns 0 for missing skill', () => {
    const { skills } = createSystem()
    expect(skills.getSkillLevel('nonexistent')).toBe(0)
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
    expect(result.changes.music?.to).toBe(5)
    // Проверяем, что shape сохранён
    const raw = world.getComponent('player', 'skills') as Record<string, unknown>
    const musicSkill = raw?.music as { level: number; xp: number }
    expect(musicSkill.level).toBe(5)
    expect(musicSkill.xp).toBe(30) // xp не должен был измениться
  })

  test('applySkillChanges converts number to { level, xp } shape', () => {
    const { world, skills } = createSystem()
    world.updateComponent('player', 'skills', { art: 2 })
    skills.applySkillChanges({ art: 1 }, 'test')
    const raw = world.getComponent('player', 'skills') as Record<string, unknown>
    const artSkill = raw?.art as { level: number; xp: number }
    expect(artSkill.level).toBe(3)
    expect(artSkill.xp).toBe(0)
  })
})
