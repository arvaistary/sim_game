import type { CanAddStudyHoursResult, NeedsState, CognitiveLoadStatus } from './index.types'
import { COGNITIVE_LOAD_CONSTANTS, ENERGY_EXHAUSTION_THRESHOLD_STUDY } from './index.constants'

/**
 * @description Domain/Education - извлекает состояние потребностей из компонентов статов
 * @return { NeedsState } состояние потребностей (energy, hunger, stress)
 */
export function getNeedsStateFromComponents(stats: Record<string, number>): NeedsState {
  return {
    energy: stats.energy ?? 100,
    hunger: stats.hunger ?? 0,
    stress: stats.stress ?? 0,
  }
}

/**
 * @description Domain/Education - определяет статус когнитивной нагрузки
 * @return { CognitiveLoadStatus } уровень нагрузки ('low' | 'medium' | 'high')
 */
export function getCognitiveLoadStatus(cognitive: number): CognitiveLoadStatus {
  if (cognitive < COGNITIVE_LOAD_CONSTANTS.LOW) return 'low'

  if (cognitive < COGNITIVE_LOAD_CONSTANTS.MEDIUM) return 'medium'

  return 'high'
}

/**
 * @description Domain/Education - проверяет, можно ли добавить часы учёбы
 * @return { CanAddStudyHoursResult } результат проверки
 */
export function canAddStudyHours(cognitive: number, energy: number): CanAddStudyHoursResult {
  if (cognitive >= COGNITIVE_LOAD_CONSTANTS.HIGH) {
    return { canDo: false, reason: 'Когнитивная нагрузка слишком высока' }
  }

  if (energy <= ENERGY_EXHAUSTION_THRESHOLD_STUDY) {
    return { canDo: false, reason: 'Энергия слишком низка для учёбы' }
  }

  return { canDo: true }
}

/**
 * @description Domain/Education - рассчитывает доступные часы учёбы на основе нагрузки и энергии
 * @return { number } количество часов учёбы
 */
export function resolveStudySessionHours(cognitive: number, energy: number, maxHours: number = 8): number {
  if (cognitive >= COGNITIVE_LOAD_CONSTANTS.HIGH || energy <= ENERGY_EXHAUSTION_THRESHOLD_STUDY) {
    return 0
  }

  if (cognitive < COGNITIVE_LOAD_CONSTANTS.LOW && energy > 80) {
    return maxHours
  }

  return Math.floor(maxHours / 2)
}

export type * from './index.types'
