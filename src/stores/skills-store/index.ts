
import type { SkillEntry } from './index.types'
import { MAX_LEVEL } from './index.constants'
import { clamp } from '@utils/clamp'

function xpForLevel(level: number): number {
  return level * 100
}

function levelFromXp(xp: number): number {
  let level: number = 0

  while (xp >= xpForLevel(level + 1)) {
    level++
  }

  return clamp(level, 0, MAX_LEVEL)
}

export const useSkillsStore = defineStore('skills', () => {
  const skills = ref<Record<string, SkillEntry>>({})

  const skillList = computed<Array<[string, SkillEntry]>>(() => Object.entries(skills.value))

  const totalLevels = computed<number>(() => {
    return Object.values(skills.value).reduce((sum: number, s: SkillEntry) => sum + s.level, 0)
  })

  const hasSkill = (key: string): boolean => key in skills.value

  const getSkillLevel = (key: string): number => {
    return skills.value[key]?.level ?? 0
  }

  const getSkillXp = (key: string): number => {
    return skills.value[key]?.xp ?? 0
  }

  function setSkillLevel(key: string, level: number): void {
    if (!skills.value[key]) {
      skills.value[key] = { level: 0, xp: 0 }
    }

    const clampedLevel: number = clamp(level, 0, MAX_LEVEL)
    skills.value[key].level = clampedLevel
    skills.value[key].xp = xpForLevel(clampedLevel)
  }

  function addSkillXp(key: string, xp: number): void {
    if (!skills.value[key]) {
      skills.value[key] = { level: 0, xp: 0 }
    }

    const newXp: number = (skills.value[key].xp ?? 0) + xp
    skills.value[key].xp = newXp
    skills.value[key].level = levelFromXp(newXp)
  }

  function applySkillChanges(changes: Record<string, number>): void {
    for (const [key, delta] of Object.entries(changes)) {
      if (delta > 0) {
        addSkillXp(key, delta * 50)
      } else {
        if (!skills.value[key]) continue

        const newXp: number = Math.max(0, (skills.value[key].xp ?? 0) + delta * 50)
        skills.value[key].xp = newXp
        skills.value[key].level = levelFromXp(newXp)
      }
    }
  }

  function hasSkillLevel(key: string, requiredLevel: number): boolean {
    return getSkillLevel(key) >= requiredLevel
  }

  function initializeSkills(initialSkills: Record<string, number>): void {
    for (const [key, level] of Object.entries(initialSkills)) {
      setSkillLevel(key, level)
    }
  }

  function reset(): void {
    skills.value = {}
  }

  function save(): Record<string, unknown> {
    return { skills: skills.value }
  }

  function load(data: Record<string, unknown>): void {
    if (data?.skills) {
      skills.value = data.skills as Record<string, SkillEntry>
    }
  }

  return {
    skills,
    skillList,
    totalLevels,
    hasSkill,
    getSkillLevel,
    getSkillXp,
    setSkillLevel,
    addSkillXp,
    applySkillChanges,
    hasSkillLevel,
    initializeSkills,
    reset,
    save,
    load,
  }
})
