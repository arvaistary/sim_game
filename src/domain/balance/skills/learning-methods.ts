import type { LearningMethod } from './learning-methods.types'

export type { LearningMethod } from './learning-methods.types'

/** Множители опыта по способу обучения. */
export const LEARNING_METHOD_MULTIPLIERS: Readonly<Record<LearningMethod, number>> = Object.freeze({
  mentor: 2,
  practice: 1.5,
  courses: 1,
  work: 1,
  books: 0.7,
  videos: 0.4,
})

/** Способ обучения для действий без явной метки. */
export const DEFAULT_LEARNING_METHOD: LearningMethod = 'practice'

/**
 * Возвращает множитель выбранного способа обучения.
 * @description [Domain] - подставляет deliberate practice для отсутствующей метки.
 * @return { number } множитель опыта
 */
export function getLearningMethodMultiplier(method: LearningMethod | undefined): number {
  return LEARNING_METHOD_MULTIPLIERS[method ?? DEFAULT_LEARNING_METHOD]
}
