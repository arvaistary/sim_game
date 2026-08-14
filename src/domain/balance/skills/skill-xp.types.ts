import type { LearningMethod } from './learning-methods.types'

/** Входные данные расчёта опыта за действие. */
export interface SkillXpGainInput {
  hours: number
  method: LearningMethod | undefined
  age: number
}

/** Входные данные распределения опыта между навыками. */
export interface SkillXpDistributionInput {
  totalXp: number
  weights: Record<string, number>
}
