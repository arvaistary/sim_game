/**
 * Cognitive Load Component (Accumulative Model)
 * Отслеживает когнитивную нагрузку от обучения с накопительной моделью
 * Сброс происходит только через сон (не автоматически по времени)
 */

import { ENERGY_EXHAUSTION_THRESHOLD_STUDY } from './learning-efficiency'

/** Игровые часы за один шаг продвижения по длинной программе */
export const EDUCATION_LONG_PROGRAM_STEP_HOURS = 4

export interface CognitiveLoadComponent {
  /** Текущая когнитивная нагрузка (0-100) */
  currentLoad: number
  /** Учебные часы в текущем "цикле бодрствования" (с последнего сна) */
  studyHoursSinceLastSleep: number
  /** Общее количество учебных часов (для статистики) */
  totalStudyHours: number
}

/**
 * Константы для когнитивной нагрузки
 */
export const COGNITIVE_LOAD_CONSTANTS = {
  /** Максимальная когнитивная нагрузка */
  MAX_LOAD: 100,
  /** Нагрузка за час обучения (полная нагрузка за 8 часов при непрерывной учёбе) */
  LOAD_PER_HOUR: 12.5, // 100 / 8
  /** Порог перегрузки (выше этого значения - штрафы к эффективности) */
  OVERLOAD_THRESHOLD: 80,
  /** Штраф к эффективности при перегрузке */
  OVERLOAD_PENALTY: 0.5, // 50% штраф
  /** Сколько учебных часов максимально в одном цикле (без сна) */
  MAX_STUDY_HOURS_CYCLE: 8,
} as const

/**
 * Создать дефолтный компонент когнитивной нагрузки
 */
export function createDefaultCognitiveLoadComponent(): CognitiveLoadComponent {
  return {
    currentLoad: 0,
    studyHoursSinceLastSleep: 0,
    totalStudyHours: 0,
  }
}

/**
 * Рассчитать штраф к эффективности на основе когнитивной нагрузки
 */
export function calculateCognitiveLoadPenalty(component: CognitiveLoadComponent): number {
  if (component.currentLoad <= COGNITIVE_LOAD_CONSTANTS.OVERLOAD_THRESHOLD) {
    return 1.0 // Без штрафа
  }

  // Линейный штраф от 1.0 до 0.5 при нагрузке от 80 до 100
  const overload = component.currentLoad - COGNITIVE_LOAD_CONSTANTS.OVERLOAD_THRESHOLD
  const maxOverload = COGNITIVE_LOAD_CONSTANTS.MAX_LOAD - COGNITIVE_LOAD_CONSTANTS.OVERLOAD_THRESHOLD
  const penaltyFactor = overload / maxOverload // 0..1

  return 1.0 - (penaltyFactor * COGNITIVE_LOAD_CONSTANTS.OVERLOAD_PENALTY)
}

/**
 * Добавить учебные часы и обновить когнитивную нагрузку
 */
export function addStudyHours(
  component: CognitiveLoadComponent,
  hours: number
): CognitiveLoadComponent {
  // Проверить лимит учебных часов в одном цикле
  const maxHoursInCycle = COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE
  const actualHours = Math.min(hours, maxHoursInCycle - component.studyHoursSinceLastSleep)
  
  // Добавить учебные часы в текущем цикле
  component.studyHoursSinceLastSleep += actualHours
  component.totalStudyHours += actualHours

  // Увеличить когнитивную нагрузку
  const loadIncrease = actualHours * COGNITIVE_LOAD_CONSTANTS.LOAD_PER_HOUR
  component.currentLoad = Math.min(
    COGNITIVE_LOAD_CONSTANTS.MAX_LOAD,
    component.currentLoad + loadIncrease
  )

  return component
}

/**
 * Сбросить когнитивную нагрузку (вызывается после сна)
 */
export function resetCognitiveLoad(component: CognitiveLoadComponent): CognitiveLoadComponent {
  component.currentLoad = 0
  component.studyHoursSinceLastSleep = 0
  return component
}

/**
 * Получить описание состояния когнитивной нагрузки
 */
export function getCognitiveLoadStatus(component: CognitiveLoadComponent): {
  status: 'normal' | 'tired' | 'overloaded' | 'exhausted'
  label: string
  description: string
  advice: string
} {
  if (component.currentLoad >= 90) {
    return {
      status: 'exhausted',
      label: 'Истощение',
      description: 'Критическая перегрузка. Эффективность обучения сильно снижена.',
      advice: 'Срочно нужна пауза — ложитесь спать.',
    }
  }

  if (component.currentLoad >= COGNITIVE_LOAD_CONSTANTS.OVERLOAD_THRESHOLD) {
    return {
      status: 'overloaded',
      label: 'Перегрузка',
      description: 'Высокая когнитивная нагрузка. Эффективность обучения снижена.',
      advice: 'Рекомендуется отдохнуть или поспать.',
    }
  }

  if (component.currentLoad >= 50) {
    return {
      status: 'tired',
      label: 'Усталость',
      description: 'Умеренная когнитивная нагрузка.',
      advice: 'Можно продолжать, но берегите силы.',
    }
  }

  return {
    status: 'normal',
    label: 'Норма',
    description: 'Когнитивная нагрузка в норме.',
    advice: 'Продолжайте обучение в обычном режиме.',
  }
}

/**
 * Проверить, можно ли добавить указанное количество учебных часов
 * (с учётом лимита в одном цикле бодрствования)
 */
export function canAddStudyHours(
  component: CognitiveLoadComponent,
  hours: number
): { canStudy: boolean; reason: string } {
  const maxHoursInCycle = COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS_CYCLE
  const availableHours = maxHoursInCycle - component.studyHoursSinceLastSleep

  if (availableHours <= 0) {
    return {
      canStudy: false,
      reason: `Вы исчерпали дневной лимит учёбы (${maxHoursInCycle} ч. с последнего сна). Поспите, чтобы сбросить усталость.`,
    }
  }

  if (hours > availableHours) {
    return {
      canStudy: false,
      reason: `Недостаточно "свежих" часов для этого шага. Осталось ${availableHours.toFixed(1)} ч. из ${maxHoursInCycle} ч. в этом цикле.`,
    }
  }

  // Проверить критическую усталость
  if (component.currentLoad >= 90) {
    return {
      canStudy: false,
      reason: 'Критическое истощение. Продолжение обучения неэффективно и вредно для здоровья. Обязательно поспите!',
    }
  }

  return { canStudy: true, reason: '' }
}
