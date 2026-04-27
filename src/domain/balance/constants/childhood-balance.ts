import { AgeGroup } from '@domain/balance/actions/types'

// ─── Таблица получения навыка за действие по возрасту ───────────────

/**
 * Сколько навыка даёт действие в зависимости от возрастной группы.
 * Чем старше — тем больше прибавка за успех, но и больше штраф за провал.
 */
export const SKILL_GAIN_BY_AGE: Record<number, { smallSuccess: number; bigSuccess: number; bigFail: number }> = {
  [AgeGroup.INFANT]:  { smallSuccess: 1,  bigSuccess: 3,  bigFail: 0 },
  [AgeGroup.TODDLER]: { smallSuccess: 1,  bigSuccess: 3,  bigFail: 0 },
  [AgeGroup.CHILD]:   { smallSuccess: 2,  bigSuccess: 7,  bigFail: 4 },
  [AgeGroup.KID]:     { smallSuccess: 3,  bigSuccess: 12, bigFail: 8 },
  [AgeGroup.TEEN]:    { smallSuccess: 4,  bigSuccess: 18, bigFail: 15 },
  [AgeGroup.YOUNG]:   { smallSuccess: 5,  bigSuccess: 25, bigFail: 20 },
  [AgeGroup.ADULT]:   { smallSuccess: 3,  bigSuccess: 15, bigFail: 10 },
}

// ─── Вероятность появления событий по типу ──────────────────────────

/**
 * Вероятность появления события по его типу.
 * everyday — повторяемые повседневные (70%)
 * formative — важные формирующие, один раз за жизнь (25%)
 * fateful — уникальные судьбоносные, только один раз (5%)
 */
export const EVENT_PROBABILITY = {
  everyday: 0.70,
  formative: 0.25,
  fateful: 0.05,
} as const

// ─── Диапазоны возрастов для возрастных групп ───────────────────────

/**
 * Диапазоны возрастов для каждой возрастной группы.
 * Используется для проверки соответствия события возрасту персонажа.
 */
export const AGE_GROUP_RANGES: Record<number, { min: number; max: number }> = {
  [AgeGroup.INFANT]:  { min: 0, max: 3 },
  [AgeGroup.TODDLER]: { min: 4, max: 7 },
  [AgeGroup.CHILD]:   { min: 8, max: 12 },
  [AgeGroup.KID]:     { min: 8, max: 12 },
  [AgeGroup.TEEN]:    { min: 13, max: 15 },
  [AgeGroup.YOUNG]:   { min: 16, max: 18 },
  [AgeGroup.ADULT]:   { min: 19, max: 100 },
}

// ─── Множитель опыта для детских навыков ────────────────────────────

/**
 * Множитель опыта для детских навыков по возрасту.
 * В «лучшем возрасте» навык прокачивается быстрее.
 */
export const CHILDHOOD_SKILL_XP_MULTIPLIER = {
  inWindow: 1.5,    // В лучшем возрасте — ×1.5
  nearWindow: 1.0,  // Рядом с лучшим возрастом — ×1.0
  outWindow: 0.5,   // Вне лучшего возраста — ×0.5
} as const

// ─── Параметры отложенных последствий ───────────────────────────────

/**
 * Параметры отложенных последствий.
 * 70% выборов имеют хотя бы одно отложенное последствие.
 * Задержка: 10-30 лет (рандомно).
 */
export const DELAYED_EFFECT_PARAMS = {
  /** Доля выборов с отложенными последствиями */
  chancePerChoice: 0.70,
  /** Минимальная задержка в годах */
  minYearsLater: 10,
  /** Максимальная задержка в годах */
  maxYearsLater: 30,
} as const

// ─── Утилиты ────────────────────────────────────────────────────────

/**
 * Получить множитель получения навыка для текущей возрастной группы.
 */
export function getSkillGainForAge(ageGroup: AgeGroup): { smallSuccess: number; bigSuccess: number; bigFail: number } {
  return SKILL_GAIN_BY_AGE[ageGroup] ?? SKILL_GAIN_BY_AGE[AgeGroup.ADULT]
}

/**
 * Получить диапазон возрастов для возрастной группы.
 */
export function getAgeRangeForGroup(ageGroup: AgeGroup): { min: number; max: number } {
  return AGE_GROUP_RANGES[ageGroup] ?? { min: 0, max: 100 }
}

/**
 * Определить возрастную группу по точному возрасту.
 */
export function getAgeGroupByAge(age: number): AgeGroup {
  for (const [group, range] of Object.entries(AGE_GROUP_RANGES)) {
    if (age >= range.min && age <= range.max) {
      return Number(group) as AgeGroup
    }
  }

  return AgeGroup.ADULT
}
