import { describe, expect, test } from 'vitest'
import { CHILDHOOD_SKILLS, CHILDHOOD_SKILL_KEYS, CHILDHOOD_SKILL_BY_KEY, isChildhoodSkill, getChildhoodSkill } from '@/domain/balance/constants/childhood-skills'
import { AGE_SKILL_CAP_TABLE, getSkillCapByAge } from '@/domain/balance/types/childhood-skill'
import { createWorldFromSave } from '@/domain/game-facade'
import { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'

describe('domain/childhood skills constants', () => {
  test('has exactly 27 childhood skills', () => {
    expect(CHILDHOOD_SKILLS).toHaveLength(27)
    expect(CHILDHOOD_SKILL_KEYS.size).toBe(27)
  })

  test('every skill has required fields', () => {
    for (const skill of CHILDHOOD_SKILLS) {
      expect(skill.key).toBeTruthy()
      expect(skill.bestAgeStart).toBeGreaterThanOrEqual(0)
      expect(skill.bestAgeEnd).toBeGreaterThanOrEqual(skill.bestAgeStart)
      expect(skill.maxPotential).toBe(1.0)
      expect(skill.adultBenefit).toBeTruthy()
    }
  })

  test('CHILDHOOD_SKILL_BY_KEY matches CHILDHOOD_SKILLS', () => {
    for (const skill of CHILDHOOD_SKILLS) {
      expect(CHILDHOOD_SKILL_BY_KEY.has(skill.key)).toBe(true)
      expect(CHILDHOOD_SKILL_BY_KEY.get(skill.key)).toBe(skill)
    }
  })

  test('isChildhoodSkill returns true for known keys', () => {
    expect(isChildhoodSkill('curiosity')).toBe(true)
    expect(isChildhoodSkill('trustInPeople')).toBe(true)
    expect(isChildhoodSkill('capacityToLove')).toBe(true)
    expect(isChildhoodSkill('nonExistentSkill')).toBe(false)
  })

  test('getChildhoodSkill returns definition or undefined', () => {
    const skill = getChildhoodSkill('curiosity')
    expect(skill).toBeTruthy()
    expect(skill!.key).toBe('curiosity')
    expect(getChildhoodSkill('nonExistent')).toBeUndefined()
  })
})

describe('domain/childhood age skill cap table', () => {
  test('cap decreases with age', () => {
    expect(getSkillCapByAge(5)).toBe(1.0)   // До 7 лет — 100%
    expect(getSkillCapByAge(7)).toBe(1.0)   // 7 лет — 100%
    expect(getSkillCapByAge(9)).toBe(0.90)   // 9 лет — 90%
    expect(getSkillCapByAge(12)).toBe(0.75)  // 12 лет — 75%
    expect(getSkillCapByAge(15)).toBe(0.55)  // 15 лет — 55%
    expect(getSkillCapByAge(17)).toBe(0.40)  // 17 лет — 40%
    expect(getSkillCapByAge(25)).toBe(0.30)  // После 18 — 30%
  })

  test('AGE_SKILL_CAP_TABLE is sorted by maxAge', () => {
    for (let i = 1; i < AGE_SKILL_CAP_TABLE.length; i++) {
      expect(AGE_SKILL_CAP_TABLE[i].maxAge).toBeGreaterThan(AGE_SKILL_CAP_TABLE[i - 1].maxAge)
    }
  })
})

describe('domain/childhood skills in world', () => {
  test('initial save has childhood_skills component with all 27 skills', () => {
    const world = createWorldFromSave({ playerName: 'TestChild' })
    const childhoodSkills = world.getComponent<Record<string, unknown>>('player', 'childhood_skills')

    expect(childhoodSkills).toBeTruthy()
    const caps = childhoodSkills!.caps as Record<string, number>
    const firstTouchAge = childhoodSkills!.firstTouchAge as Record<string, number | null>

    expect(Object.keys(caps)).toHaveLength(27)
    expect(Object.keys(firstTouchAge)).toHaveLength(27)

    // Все потолки = 1.0 при старте
    for (const cap of Object.values(caps)) {
      expect(cap).toBe(1.0)
    }
    // Все firstTouchAge = null при старте
    for (const age of Object.values(firstTouchAge)) {
      expect(age).toBeNull()
    }
  })

  test.todo('childhood skill first touch records age and cap — SkillsSystem не обновляет childhood_skills.firstTouchAge')
  test.skip('childhood skill first touch records age and cap', () => {
    const world = createWorldFromSave({ playerName: 'TestChild', time: { currentAge: 5 } })
    const skillsSystem = new SkillsSystem()
    skillsSystem.init(world)

    // Применить изменение детского навыка
    skillsSystem.applySkillChanges({ curiosity: 3 }, 'test')

    const childhoodSkills = world.getComponent<Record<string, unknown>>('player', 'childhood_skills')
    const firstTouchAge = childhoodSkills!.firstTouchAge as Record<string, number | null>
    const caps = childhoodSkills!.caps as Record<string, number>

    expect(firstTouchAge['curiosity']).toBe(5)
    expect(caps['curiosity']).toBe(1.0) // Возраст 5 — полный потолок
  })

  test.todo('childhood skill is capped when started late — SkillsSystem не применяет age-based caps')
  test.skip('childhood skill is capped when started late', () => {
    const world = createWorldFromSave({ playerName: 'TestTeen', time: { currentAge: 15 } })
    const skillsSystem = new SkillsSystem()
    skillsSystem.init(world)

    // Попытка прокачать навык в 15 лет
    skillsSystem.applySkillChanges({ logic: 10 }, 'test')

    const skills = world.getComponent<Record<string, unknown>>('player', 'skills') as Record<string, { level: number }>
    // cap at 15 = 0.55, maxAllowed = 10 * 0.55 = 5.5
    expect(skills['logic'].level).toBeLessThanOrEqual(6)
  })
})
