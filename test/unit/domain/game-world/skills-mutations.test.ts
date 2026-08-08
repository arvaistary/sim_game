import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  addSkillXp,
  applySkillChanges,
  getSkillLevel,
  getSkillXp,
  hasSkill,
  initializeSkills,
  setSkillLevel,
} from '@/domain/game-world/commands'

describe('domain skills mutations', () => {
  it('setSkillLevel: устанавливает уровень и пересчитывает XP', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setSkillLevel(world, 'programming', 5)

    expect(getSkillLevel(world, 'programming')).toBe(5)
    expect(getSkillXp(world, 'programming')).toBe(500) // xpForLevel(5) = 5 * 100
  })

  it('setSkillLevel: clamp уровня в диапазоне 0..10', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setSkillLevel(world, 'programming', 100)

    expect(getSkillLevel(world, 'programming')).toBe(10)
  })

  it('addSkillXp: добавляет XP и пересчитывает уровень', () => {
    const world: GameWorld = GameWorld.createEmpty()

    addSkillXp(world, 'programming', 250) // level 2.5

    expect(getSkillLevel(world, 'programming')).toBe(2.5)
    expect(getSkillXp(world, 'programming')).toBe(250)

    addSkillXp(world, 'programming', 50) // 300 → level 3

    expect(getSkillLevel(world, 'programming')).toBe(3)
  })

  it('applySkillChanges: применяет положительные и отрицательные дельты', () => {
    const world: GameWorld = GameWorld.createEmpty()
    setSkillLevel(world, 'programming', 5)

    applySkillChanges(world, { programming: 2, fitness: 1 })

    expect(getSkillLevel(world, 'programming')).toBeGreaterThan(5)
    expect(hasSkill(world, 'fitness')).toBe(true)
  })

  it('applySkillChanges: не падает на negative delta для несуществующего навыка', () => {
    const world: GameWorld = GameWorld.createEmpty()

    applySkillChanges(world, { unknown_skill: -1 })

    expect(hasSkill(world, 'unknown_skill')).toBe(false)
  })

  it('initializeSkills: массовая инициализация по уровням', () => {
    const world: GameWorld = GameWorld.createEmpty()

    initializeSkills(world, { programming: 3, communication: 2 })

    expect(getSkillLevel(world, 'programming')).toBe(3)
    expect(getSkillLevel(world, 'communication')).toBe(2)
  })

  it('applySkillChanges: пересчитывает skillModifiers после изменения', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const multiplierBefore: number = world.skills.modifiers.salaryMultiplier

    applySkillChanges(world, { professionalism: 10 })

    expect(world.skills.modifiers.salaryMultiplier).toBeGreaterThan(multiplierBefore)
  })

  it('queries: getSkillLevel/getSkillXp/hasSkill для отсутствующего навыка', () => {
    const world: GameWorld = GameWorld.createEmpty()

    expect(getSkillLevel(world, 'unknown')).toBe(0)
    expect(getSkillXp(world, 'unknown')).toBe(0)
    expect(hasSkill(world, 'unknown')).toBe(false)
  })
})
