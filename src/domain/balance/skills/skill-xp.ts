import { getLearningMethodMultiplier } from './learning-methods'
import type { SkillXpDistributionInput, SkillXpGainInput } from './skill-xp.types'

export type { SkillXpDistributionInput, SkillXpGainInput } from './skill-xp.types'

/**
 * Возвращает возрастной множитель обучения.
 * @description [Domain] - ускоряет обучение в детстве и замедляет его после шестидесяти.
 * @return { number } множитель от 0.3 до 2.5
 */
export function getAgeLearningMultiplier(age: number): number {
  if (age <= 7) return 2.5

  if (age <= 12) return 2

  if (age <= 18) return 1.7

  if (age <= 25) return 1.4

  if (age <= 35) return 1.1

  if (age <= 45) return 0.8

  if (age <= 60) return 0.5

  return 0.3
}

/**
 * Рассчитывает опыт за выполнение действия.
 * @description [Domain] - умножает часы на способ обучения и возраст.
 * @return { number } опыт за действие
 */
export function calculateSkillXpGain(data: SkillXpGainInput): number {
  const { hours, method, age } = data

  if (!Number.isFinite(hours) || hours <= 0) return 0

  return hours * getLearningMethodMultiplier(method) * getAgeLearningMultiplier(age)
}

/**
 * Распределяет опыт между развиваемыми навыками.
 * @description [Domain] - трактует значения weights как относительные веса.
 * @return { Record<string, number> } опыт по навыкам
 */
export function distributeSkillXp(data: SkillXpDistributionInput): Record<string, number> {
  const { totalXp, weights } = data

  if (!Number.isFinite(totalXp) || totalXp <= 0) return {}

  const positiveEntries: Array<[string, number]> = Object.entries(weights).filter(
    ([, weight]: [string, number]) => Number.isFinite(weight) && weight > 0,
  )
  const weightSum: number = positiveEntries.reduce(
    (sum: number, [, weight]: [string, number]) => sum + weight,
    0,
  )

  if (weightSum <= 0) return {}

  const distributed: Record<string, number> = {}

  for (const [skillKey, weight] of positiveEntries) {
    distributed[skillKey] = totalXp * (weight / weightSum)
  }

  return distributed
}
