/**
 * Конфиг распределения действий по табам страницы «Обучение».
 *
 * Таб «Практика и привычки» включает:
 *   — 5 действий из категории education (soft skills / mindfulness / рефлексия)
 *   — все действия из категории selfdev
 *
 * Таб «Учёба и навыки» включает:
 *   — все остальные действия из категории education
 */

/** ID education-действий, относящихся к табу «Практика и привычки» */
export const PRACTICE_ACTION_IDS: ReadonlySet<string> = new Set([
  'edu_public_speaking',
  'edu_diary',
  'edu_mindfulness',
])

/** Backward-compatible alias for older imports. */
export const GROWTH_ACTION_IDS = PRACTICE_ACTION_IDS
