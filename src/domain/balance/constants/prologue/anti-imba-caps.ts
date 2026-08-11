/** Жёсткие anti-imba caps на handoff во взрослую жизнь. */
export const PROLOGUE_ANTI_IMBA_CAPS = {
  maxDistinctAdultSkillsWithLevel: 5,
  maxSumOfAdultSkillLevels: 8,
  maxSingleAdultSkillLevel: 3,
  maxTraitsGranted: 2,
} as const

/** Soft-cap очков тегов по стадиям (техникум|вуз — один postsec). */
export const PROLOGUE_STAGE_TAG_BUDGETS = {
  early: 4,
  school: 8,
  postsec: 6,
} as const

/** Clean-slate baseline (adult start без пролога). */
export const CLEAN_SLATE_ADULT_SKILLS: Record<string, number> = {
  timeManagement: 1,
  communication: 1,
  financialLiteracy: 1,
}

export const CLEAN_SLATE_EDUCATION_LEVEL = 'Нет' as const

/** Границы exam multiplier. */
export const EXAM_MULTIPLIER_MIN = 0.7
export const EXAM_MULTIPLIER_MAX = 1.15
export const EXAM_MULTIPLIER_SPAN = 0.45

/** Возраст выхода из пролога (сжатая fiction учёбы). */
export const PROLOGUE_HANDOFF_AGE = 18
