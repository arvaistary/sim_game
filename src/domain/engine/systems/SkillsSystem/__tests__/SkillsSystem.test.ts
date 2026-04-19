/**
 * Тесты для системы навыков
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkillsSystem } from '../index'
import type { GameWorld } from '../../../world'
import { SKILLS_COMPONENT, SKILL_MODIFIERS_COMPONENT } from '../../../components/index'

const getComponentMock = vi.fn()
const mockWorld = {
  getComponent: getComponentMock,
  addComponent: vi.fn(),
  getSystem: vi.fn(),
  addSystem: vi.fn(),
} as unknown as GameWorld

describe('SkillsSystem', () => {
  let skillsSystem: SkillsSystem

  beforeEach(() => {
    vi.clearAllMocks()
    skillsSystem = new SkillsSystem()

    const mockSkills = {
      timeManagement: { level: 3, xp: 30 },
      communication: { level: 5, xp: 50 },
      financialLiteracy: { level: 2, xp: 20 },
    }

    const mockModifiers = {
      salaryMultiplier: 1.0,
      workEfficiencyMultiplier: 1.0,
      learningSpeedMultiplier: 1.0,
    }

    getComponentMock.mockImplementation((entityId: string, componentId: string) => {
      if (componentId === SKILLS_COMPONENT) return mockSkills
      if (componentId === SKILL_MODIFIERS_COMPONENT) return mockModifiers
      return null
    })

    skillsSystem.init(mockWorld)
  })

  describe('getSkillLevel', () => {
    it('должен возвращать уровень навыка', () => {
      const level = skillsSystem.getSkillLevel('timeManagement')
      expect(level).toBe(3)
    })

    it('должен возвращать 0 для несуществующего навыка', () => {
      const level = skillsSystem.getSkillLevel('nonExistentSkill')
      expect(level).toBe(0)
    })

    it('должен обрабатывать legacy формат (number)', () => {
      const mockSkills = { timeManagement: 3 }
      getComponentMock.mockReturnValue(mockSkills)

      skillsSystem.init(mockWorld)
      const level = skillsSystem.getSkillLevel('timeManagement')
      expect(level).toBe(3)
    })
  })

  describe('applySkillChanges', () => {
    it('должен применять изменения к навыкам', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 2,
        communication: 1,
      }, 'test')

      expect(result.changed).toBe(true)
      expect(result.changes.timeManagement).toEqual({
        from: 3,
        to: 5,
        delta: 2,
      })
      expect(result.changes.communication).toEqual({
        from: 5,
        to: 6,
        delta: 1,
      })
    })

    it('не должен применять изменения, если результат не меняет уровень', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 0.1,
      }, 'test')

      expect(result.changed).toBe(false)
      expect(Object.keys(result.changes)).toHaveLength(0)
    })

    it('должен ограничивать уровень максимумом 10', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 10,
      }, 'test')

      expect(result.changes.timeManagement.to).toBe(10)
    })

    it('должен ограничивать уровень минимумом 0', () => {
      const mockSkills = { timeManagement: { level: 2, xp: 20 } }
      getComponentMock.mockReturnValue(mockSkills)
      skillsSystem.init(mockWorld)

      const result = skillsSystem.applySkillChanges({
        timeManagement: -5,
      }, 'test')

      expect(result.changes.timeManagement.to).toBe(0)
    })
  })

  describe('setSkillLevel', () => {
    it('должен устанавливать уровень навыка', () => {
      skillsSystem.setSkillLevel('financialLiteracy', 8, 'test')

      const level = skillsSystem.getSkillLevel('financialLiteracy')
      expect(level).toBe(8)
    })

    it('должен ограничивать уровень в пределах 0-10', () => {
      skillsSystem.setSkillLevel('financialLiteracy', 15, 'test')
      expect(skillsSystem.getSkillLevel('financialLiteracy')).toBe(10)

      skillsSystem.setSkillLevel('financialLiteracy', -5, 'test')
      expect(skillsSystem.getSkillLevel('financialLiteracy')).toBe(0)
    })
  })

  describe('hasSkillLevel', () => {
    it('должен проверять, достигнут ли требуемый уровень', () => {
      expect(skillsSystem.hasSkillLevel('timeManagement', 2)).toBe(true)
      expect(skillsSystem.hasSkillLevel('timeManagement', 3)).toBe(true)
      expect(skillsSystem.hasSkillLevel('timeManagement', 4)).toBe(false)
    })
  })

  describe('getSkills', () => {
    it('должен возвращать все навыки в виде { key: level }', () => {
      const skills = skillsSystem.getSkills()

      expect(skills).toEqual({
        timeManagement: 3,
        communication: 5,
        financialLiteracy: 2,
      })
    })
  })

  describe('getModifiers', () => {
    it('должен возвращать модификаторы навыков', () => {
      const modifiers = skillsSystem.getModifiers()

      expect(modifiers).toHaveProperty('salaryMultiplier')
      expect(modifiers).toHaveProperty('workEfficiencyMultiplier')
      expect(modifiers).toHaveProperty('learningSpeedMultiplier')
    })
  })

  describe('recalculateModifiers', () => {
    it('должен пересчитывать модификаторы при изменении навыков', () => {
      const recalculateSpy = vi.spyOn(skillsSystem, 'recalculateModifiers')

      skillsSystem.applySkillChanges({ timeManagement: 2 }, 'test')

      expect(recalculateSpy).toHaveBeenCalled()
    })
  })
})

describe('Skill progression models', () => {
  it('должен поддерживать XP модель', () => {
    const skillsSystem = new SkillsSystem()

    const mockSkills = {
      timeManagement: { level: 3, xp: 35 },
    }

    getComponentMock.mockReturnValue(mockSkills)
    skillsSystem.init(mockWorld)

    const level = skillsSystem.getSkillLevel('timeManagement')
    expect(level).toBe(3)
  })

  it('должен конвертировать legacy уровни в XP', () => {
    const skillsSystem = new SkillsSystem()

    const mockSkills = {
      timeManagement: 4,
    }

    getComponentMock.mockReturnValue(mockSkills)
    skillsSystem.init(mockWorld)

    const level = skillsSystem.getSkillLevel('timeManagement')
    expect(level).toBe(4)
  })
})
