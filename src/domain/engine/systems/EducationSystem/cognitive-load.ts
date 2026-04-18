/**
 * Cognitive Load Component
 * Отслеживает когнитивную нагрузку от обучения
 */

export interface CognitiveLoadComponent {
  /** Текущая когнитивная нагрузка (0-100) */
  currentLoad: number
  /** Учебные часы сегодня */
  studyHoursToday: number
  /** Максимальные учебные часы в день без штрафа */
  maxStudyHours: number
  /** День последнего обновления */
  lastUpdateDay: number
}

/**
 * Константы для когнитивной нагрузки
 */
export const COGNITIVE_LOAD_CONSTANTS = {
  /** Максимальная когнитивная нагрузка */
  MAX_LOAD: 100,
  /** Максимальные учебные часы в день без штрафа */
  MAX_STUDY_HOURS: 8,
  /** Нагрузка за час обучения */
  LOAD_PER_HOUR: 12.5, // 100 / 8 = 12.5
  /** Восстановление нагрузки за час отдыха */
  RECOVERY_PER_HOUR: 5,
  /** Порог перегрузки (выше этого значения - штрафы) */
  OVERLOAD_THRESHOLD: 80,
  /** Штраф к эффективности при перегрузке */
  OVERLOAD_PENALTY: 0.5, // 50% штраф
} as const

/**
 * Создать дефолтный компонент когнитивной нагрузки
 */
export function createDefaultCognitiveLoadComponent(currentDay: number): CognitiveLoadComponent {
  return {
    currentLoad: 0,
    studyHoursToday: 0,
    maxStudyHours: COGNITIVE_LOAD_CONSTANTS.MAX_STUDY_HOURS,
    lastUpdateDay: currentDay,
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
  hours: number,
  currentDay: number
): CognitiveLoadComponent {
  // Сбросить если новый день
  if (component.lastUpdateDay !== currentDay) {
    component.studyHoursToday = 0
    component.currentLoad = 0
    component.lastUpdateDay = currentDay
  }
  
  // Добавить учебные часы
  component.studyHoursToday += hours
  
  // Увеличить когнитивную нагрузку
  const loadIncrease = hours * COGNITIVE_LOAD_CONSTANTS.LOAD_PER_HOUR
  component.currentLoad = Math.min(
    COGNITIVE_LOAD_CONSTANTS.MAX_LOAD,
    component.currentLoad + loadIncrease
  )
  
  return component
}

/**
 * Восстановить когнитивную нагрузку во время отдыха
 */
export function recoverCognitiveLoad(
  component: CognitiveLoadComponent,
  restHours: number,
  currentDay: number
): CognitiveLoadComponent {
  // Сбросить если новый день
  if (component.lastUpdateDay !== currentDay) {
    component.studyHoursToday = 0
    component.currentLoad = 0
    component.lastUpdateDay = currentDay
  }
  
  // Восстановить когнитивную нагрузку
  const recovery = restHours * COGNITIVE_LOAD_CONSTANTS.RECOVERY_PER_HOUR
  component.currentLoad = Math.max(0, component.currentLoad - recovery)
  
  return component
}

/**
 * Получить описание состояния когнитивной нагрузки
 */
export function getCognitiveLoadStatus(component: CognitiveLoadComponent): {
  status: 'normal' | 'tired' | 'overloaded' | 'exhausted'
  label: string
  description: string
} {
  if (component.currentLoad >= 90) {
    return {
      status: 'exhausted',
      label: 'Истощение',
      description: 'Критическая перегрузка. Эффективность обучения сильно снижена.',
    }
  }
  
  if (component.currentLoad >= COGNITIVE_LOAD_CONSTANTS.OVERLOAD_THRESHOLD) {
    return {
      status: 'overloaded',
      label: 'Перегрузка',
      description: 'Высокая когнитивная нагрузка. Эффективность обучения снижена.',
    }
  }
  
  if (component.currentLoad >= 50) {
    return {
      status: 'tired',
      label: 'Усталость',
      description: 'Умеренная когнитивная нагрузка. Рекомендуется сделать перерыв.',
    }
  }
  
  return {
    status: 'normal',
    label: 'Норма',
    description: 'Когнитивная нагрузка в норме.',
  }
}
