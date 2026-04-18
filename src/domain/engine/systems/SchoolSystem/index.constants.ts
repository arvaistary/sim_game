import type { StatChanges } from '@/domain/balance/types'

/** Возраст зачисления в 1-й класс */
export const SCHOOL_START_AGE = 7

/** Последний год обучения в школе (11-й класс) */
export const SCHOOL_END_AGE = 17

/** Возраст выпуска и выставления educationLevel «Среднее» (после 11 классов) */
export const SCHOOL_GRADUATION_AGE = SCHOOL_END_AGE + 1

/** Часов «школы» в учебный день (для доменных событий / метаданных, без advanceHours) */
export const SCHOOL_HOURS_PER_DAY = 6

export const BASE_SKIP_CHANCE = 0.05
export const MIN_SKIP_CHANCE = 0.01
export const MAX_SKIP_CHANCE = 0.9

export const GRADE_DURATION_YEARS = 1
export const MAX_GRADE = 11

/** Дневные эффекты посещения (канонически через StatsSystem) */
export const SCHOOL_STAT_CHANGES_PER_DAY: StatChanges = {
  energy: -8,
  stress: 3,
  mood: -2,
}

/** Дневные эффекты навыков (канонически через SkillsSystem) */
export const SCHOOL_SKILL_CHANGES_PER_DAY: Record<string, number> = {
  professionalism: 0.1,
}
