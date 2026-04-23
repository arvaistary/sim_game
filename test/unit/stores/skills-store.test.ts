import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSkillsStore } from '@/stores/skills-store'

describe('skills-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('должен инициализироваться с пустыми навыками', () => {
    const skills = useSkillsStore()
    expect(skills.skills).toEqual({})
    expect(skills.totalLevels).toBe(0)
  })

  it('должен правильно устанавливать уровень навыка', () => {
    const skills = useSkillsStore()
    skills.setSkillLevel('professionalism', 5)
    expect(skills.getSkillLevel('professionalism')).toBe(5)
  })

  it('должен правильно добавлять XP', () => {
    const skills = useSkillsStore()
    skills.addSkillXp('professionalism', 150)
    expect(skills.getSkillXp('professionalism')).toBe(150)
    expect(skills.getSkillLevel('professionalism')).toBe(1) // 100 XP = level 1
  })

  it('должен правильно применять изменения навыков', () => {
    const skills = useSkillsStore()
    skills.setSkillLevel('professionalism', 3)
    skills.setSkillLevel('communication', 2)
    // Положительные изменения увеличивают XP
    skills.applySkillChanges({ professionalism: 2 })
    // professionalizm 3 = 300 XP, + 100 XP/level = 500 = level 4
    expect(skills.getSkillLevel('professionalism')).toBe(4)
    // Негативные изменения уменьшают
    skills.applySkillChanges({ communication: -1 })
    expect(skills.getSkillLevel('communication')).toBe(1)
  })

  it('hasSkill должен проверять наличие', () => {
    const skills = useSkillsStore()
    expect(skills.hasSkill('professionalism')).toBe(false)
    skills.setSkillLevel('professionalism', 1)
    expect(skills.hasSkill('professionalism')).toBe(true)
  })

  it('hasSkillLevel должен проверять уровень', () => {
    const skills = useSkillsStore()
    skills.setSkillLevel('professionalism', 3)
    expect(skills.hasSkillLevel('professionalism', 2)).toBe(true)
    expect(skills.hasSkillLevel('professionalism', 4)).toBe(false)
  })

  it('должен правильно инициализировать навыки', () => {
    const skills = useSkillsStore()
    skills.initializeSkills({ professionalism: 3, communication: 5 })
    expect(skills.getSkillLevel('professionalism')).toBe(3)
    expect(skills.getSkillLevel('communication')).toBe(5)
  })

  it('должен ограничивать уровень в диапазоне 0-10', () => {
    const skills = useSkillsStore()
    skills.setSkillLevel('professionalism', 15)
    expect(skills.getSkillLevel('professionalism')).toBe(10)

    skills.setSkillLevel('professionalism', -5)
    expect(skills.getSkillLevel('professionalism')).toBe(0)
  })

  it('reset должен сбрасывать состояние', () => {
    const skills = useSkillsStore()
    skills.setSkillLevel('professionalism', 5)
    skills.reset()
    expect(skills.skills).toEqual({})
  })
})