/**
 * Тесты для системы навыков
 */

import { SkillsSystem } from '../index'
import type { GameWorld } from '../../world'
import { PLAYER_ENTITY, SKILLS_COMPONENT, SKILL_MODIFIERS_COMPONENT } from '../../../components/index'

// Mock GameWorld
const mockWorld = {
  getComponent: jest.fn(),
  addComponent: jest.fn(),
  getSystem: jest.fn(),
  addSystem: jest.fn()
} as unknown as GameWorld

describe('SkillsSystem', () => {
  let skillsSystem: SkillsSystem

  beforeEach(() => {
    jest.clearAllMocks()
    skillsSystem = new SkillsSystem()
    
    // Mock начального состояния
    const mockSkills = {
      timeManagement: { level: 3, xp: 30 },
      communication: { level: 5, xp: 50 },
      financialLiteracy: { level: 2, xp: 20 }
    }
    
    const mockModifiers = {
      salaryMultiplier: 1.0,
      workEfficiencyMultiplier: 1.0,
      learningSpeedMultiplier: 1.0
    }
    
    ;(mockWorld.getComponent as jest.Mock)
      .mockImplementation((entityId: string, componentId: string) => {
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
      ;(mockWorld.getComponent as jest.Mock).mockReturnValue(mockSkills)
      
      skillsSystem.init(mockWorld)
      const level = skillsSystem.getSkillLevel('timeManagement')
      expect(level).toBe(3)
    })
  })

  describe('applySkillChanges', () => {
    it('должен применять изменения к навыкам', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 2,
        communication: 1
      }, 'test')
      
      expect(result.changed).toBe(true)
      expect(result.changes.timeManagement).toEqual({
        from: 3,
        to: 5,
        delta: 2
      })
      expect(result.changes.communication).toEqual({
        from: 5,
        to: 6,
        delta: 1
      })
    })

    it('не должен применять изменения, если результат не меняет уровень', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 0.1
      }, 'test')
      
      expect(result.changed).toBe(false)
      expect(Object.keys(result.changes)).toHaveLength(0)
    })

    it('должен ограничивать уровень максимумом 10', () => {
      const result = skillsSystem.applySkillChanges({
        timeManagement: 10
      }, 'test')
      
      expect(result.changes.timeManagement.to).toBe(10)
    })

    it('должен ограничивать уровень минимумом 0', () => {
      const mockSkills = { timeManagement: { level: 2, xp: 20 } }
      ;(mockWorld.getComponent as jest.Mock).mockReturnValue(mockSkills)
      skillsSystem.init(mockWorld)
      
      const result = skillsSystem.applySkillChanges({
        timeManagement: -5
      }, 'test')
      
      expect(result.changes.timeManagement.to).toBe(0)
    })
  })

  describe('setSkillLevel', () => {
    it('должен устанавливать уровень навыка', () => {
      skillsSystem.setSkillLevel('financialLiteracy', 8, 'test')
      
      // Проверяем, что уровень установлен
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
        financialLiteracy: 2
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
      // Spy на recalculateModifiers
      const recalculateSpy = jest.spyOn(skillsSystem, 'recalculateModifiers')
      
      skillsSystem.applySkillChanges({ timeManagement: 2 }, 'test')
      
      expect(recalculateSpy).toHaveBeenCalled()
    })
  })
})

describe('Skill progression models', () => {
  it('должен поддерживать XP модель', () => {
    const skillsSystem = new SkillsSystem()
    
    // Mock с XP моделью
    const mockSkills = {
      timeManagement: { level: 3, xp: 35 } // 35 XP = уровень 3.5
    }
    
    ;(mockWorld.getComponent as jest.Mock).mockReturnValue(mockSkills)
    skillsSystem.init(mockWorld)
    
    const level = skillsSystem.getSkillLevel('timeManagement')
    // В XP модели уровень вычисляется из XP
    expect(level).toBe(3) // Math.floor(35 / 10)
  })

  it('должен конвертировать legacy уровни в XP', () => {
    const skillsSystem = new SkillsSystem()
    
    // Mock с legacy форматом
    const mockSkills = {
      timeManagement: 4 // legacy: только число
    }
    
    ;(mockWorld.getComponent as jest.Mock).mockReturnValue(mockSkills)
    skillsSystem.init(mockWorld)
    
    const level = skillsSystem.getSkillLevel('timeManagement')
    expect(level).toBe(4)
  })
})