
import type { ComputedRef, Ref } from 'vue'
import type { SkillModifiers } from '@/domain/balance/types'
import { recalculateSkillModifiers } from '@/domain/balance/constants/skill-modifiers'
import { MAX_SKILL_LEVEL } from '@/domain/balance/constants/skills-constants'
import type { SkillEntry } from './skills-store.types'

export type { SkillsComponent, SkillEntry } from './skills-store.types'

const MAX_LEVEL: number = MAX_SKILL_LEVEL

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function xpForLevel(level: number): number {
  return level * 100
}

function levelFromXp(xp: number): number {
  return clamp(Math.floor(xp / xpForLevel(1)), 0, MAX_LEVEL)
}

export const useSkillsStore = defineStore('skills', () => {
  const skills: Ref<Record<string, SkillEntry>> = ref<Record<string, SkillEntry>>({})

  const skillList: ComputedRef<Array<[string, SkillEntry]>> = computed(() => Object.entries(skills.value))

  const totalLevels: ComputedRef<number> = computed(() => {
    return Object.values(skills.value as Record<string, SkillEntry>).reduce(
      (sum: number, s: SkillEntry) => sum + s.level,
      0
    )
  })

  const skillModifiers: ComputedRef<SkillModifiers> = computed(() =>
    recalculateSkillModifiers(skills.value as Record<string, number | { level?: number; xp?: number }>)
  )

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
    skills.value[key]!.level = clampedLevel
    skills.value[key]!.xp = xpForLevel(clampedLevel)
  }

  function addSkillXp(key: string, xp: number): void {
    if (!skills.value[key]) {
      skills.value[key] = { level: 0, xp: 0 }
    }

    const newXp: number = (skills.value[key]!.xp ?? 0) + xp
    skills.value[key]!.xp = newXp
    skills.value[key]!.level = levelFromXp(newXp)
  }

  function applySkillChanges(changes: Record<string, number>): void {
    for (const [key, delta] of Object.entries(changes)) {
      if (delta > 0) {
        addSkillXp(key, delta * 100)
      } else {
        if (!skills.value[key]) continue

        const newXp: number = Math.max(0, (skills.value[key]!.xp ?? 0) + delta * 100)
        skills.value[key]!.xp = newXp
        skills.value[key]!.level = levelFromXp(newXp)
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
    const snapshot: Record<string, SkillEntry> = {}

    for (const [key, entry] of Object.entries(skills.value)) {
      snapshot[key] = {
        level: entry.level,
        xp: entry.xp,
      }
    }

    return {
      skills: snapshot,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (data.skills && typeof data.skills === 'object') {
      skills.value = data.skills as Record<string, SkillEntry>
      return
    }

    if (data.entries && typeof data.entries === 'object') {
      skills.value = data.entries as Record<string, SkillEntry>
    }
  }

  return {
    skills,
    skillList,
    totalLevels,
    skillModifiers,
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
