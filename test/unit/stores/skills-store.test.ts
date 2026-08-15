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

  it('hasSkill должен проверять наличие', () => {
    const skills = useSkillsStore()
    expect(skills.hasSkill('professionalism')).toBe(false)
    skills.load({ skills: { professionalism: { level: 1, xp: 50 } } })
    expect(skills.hasSkill('professionalism')).toBe(true)
  })

  it('hasSkillLevel должен проверять уровень', () => {
    const skills = useSkillsStore()
    skills.load({ skills: { professionalism: { level: 3, xp: 350 } } })
    expect(skills.hasSkillLevel('professionalism', 2)).toBe(true)
    expect(skills.hasSkillLevel('professionalism', 4)).toBe(false)
  })

  it('is a read-only projection of the world snapshot', () => {
    const skills = useSkillsStore()

    expect('setSkillLevel' in skills).toBe(false)
    expect('addSkillXp' in skills).toBe(false)
    expect('applySkillChanges' in skills).toBe(false)
    expect('initializeSkills' in skills).toBe(false)

    skills.load({ skills: { cooking: { level: 4, xp: 700 } } })

    expect(skills.getSkillLevel('cooking')).toBe(4)
    expect(skills.getSkillXp('cooking')).toBe(700)
  })

  it('reset должен сбрасывать состояние', () => {
    const skills = useSkillsStore()
    skills.load({ skills: { professionalism: { level: 5, xp: 1250 } } })
    skills.reset()
    expect(skills.skills).toEqual({})
  })
})
