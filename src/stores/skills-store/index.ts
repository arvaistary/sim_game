
import type { ComputedRef, Ref } from 'vue'
import type { SkillModifiers } from '@/domain/balance/types'
import { recalculateSkillModifiers } from '@/domain/balance/constants/skill-modifiers'
import { normalizeSkillLevels } from '@/domain/balance/skills'
import type { SkillEntry, SkillLevelInput } from '@/domain/balance/skills'
import type { SkillEntry as StoreSkillEntry } from './skills-store.types'

export type { SkillsComponent, SkillEntry } from './skills-store.types'

function isSkillEntry(value: unknown): value is SkillEntry {
  if (typeof value !== 'object' || value === null) return false

  const record: Record<string, unknown> = value as Record<string, unknown>

  return typeof record.level === 'number'
    && Number.isFinite(record.level)
    && typeof record.xp === 'number'
    && Number.isFinite(record.xp)
}

function normalizeLoadedSkills(value: unknown): Record<string, StoreSkillEntry> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}

  const raw: Record<string, SkillLevelInput> = {}

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) raw[key] = entry
    else if (isSkillEntry(entry)) raw[key] = entry
  }

  return normalizeSkillLevels(raw)
}

export const useSkillsStore = defineStore('skills', () => {
  const skills: Ref<Record<string, StoreSkillEntry>> = ref<Record<string, StoreSkillEntry>>({})

  const skillList: ComputedRef<Array<[string, StoreSkillEntry]>> = computed(() => Object.entries(skills.value))

  const totalLevels: ComputedRef<number> = computed(() => {
    return Object.values(skills.value as Record<string, StoreSkillEntry>).reduce(
      (sum: number, s: StoreSkillEntry) => sum + s.level,
      0
    )
  })

  const skillModifiers: ComputedRef<SkillModifiers> = computed(() =>
    recalculateSkillModifiers(skills.value)
  )

  const hasSkill = (key: string): boolean => key in skills.value

  const getSkillLevel = (key: string): number => {
    return skills.value[key]?.level ?? 0
  }

  const getSkillXp = (key: string): number => {
    return skills.value[key]?.xp ?? 0
  }

  function hasSkillLevel(key: string, requiredLevel: number): boolean {
    return getSkillLevel(key) >= requiredLevel
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
      skills.value = normalizeLoadedSkills(data.skills)
      return
    }

    if (data.entries && typeof data.entries === 'object') {
      skills.value = normalizeLoadedSkills(data.entries)
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
    hasSkillLevel,
    reset,
    save,
    load,
  }
})
