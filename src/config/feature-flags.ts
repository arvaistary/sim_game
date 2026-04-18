/**
 * Feature Flags для time-системы
 * Позволяют поэтапно включать новые функциональности
 */

export interface TimeFeatureFlags {
  // Периодические callbacks V2 - новая реализация оркестрации
  periodHooksV2: boolean
  
  // Event dedup V2 - улучшенная система дедупликации событий
  eventDedupV2: boolean
  
  // Availability cache V2 - кэширование доступности действий
  availabilityCacheV2: boolean
  
  // Strict period processing - строгий режим обработки периодов
  strictPeriodProcessing: boolean
  
  // Time diagnostics - включение диагностики
  timeDiagnostics: boolean
  
  // Deterministic replay - детерминированный replay для отладки
  deterministicReplay: boolean
}

/**
 * Конфигурация feature flags по умолчанию
 * В production все флаги включены для максимальной функциональности
 */
export const DEFAULT_TIME_FEATURE_FLAGS: TimeFeatureFlags = {
  periodHooksV2: true,
  eventDedupV2: true,
  availabilityCacheV2: true, // Реализовано: кэш доступности по worldVersion
  strictPeriodProcessing: true, // Реализовано: строгий режим обработки периодов
  timeDiagnostics: true,
  deterministicReplay: true, // Реализовано: детерминированный replay для отладки
}

/**
 * Текущая конфигурация feature flags
 * Может быть переопределена через localStorage или конфигурацию
 */
let currentFlags: TimeFeatureFlags = { ...DEFAULT_TIME_FEATURE_FLAGS }

/**
 * Получить текущие feature flags
 */
export function getTimeFeatureFlags(): TimeFeatureFlags {
  return { ...currentFlags }
}

/**
 * Установить feature flags
 */
export function setTimeFeatureFlags(flags: Partial<TimeFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags }
  
  // Сохраняем в localStorage для персистентности
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('timeFeatureFlags', JSON.stringify(currentFlags))
    } catch (e) {
      console.warn('Failed to save time feature flags to localStorage:', e)
    }
  }
}

/**
 * Загрузить feature flags из localStorage
 */
export function loadTimeFeatureFlags(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('timeFeatureFlags')
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<TimeFeatureFlags>
        currentFlags = { ...DEFAULT_TIME_FEATURE_FLAGS, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load time feature flags from localStorage:', e)
    }
  }
}

/**
 * Сбросить feature flags к значениям по умолчанию
 */
export function resetTimeFeatureFlags(): void {
  currentFlags = { ...DEFAULT_TIME_FEATURE_FLAGS }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('timeFeatureFlags')
    } catch (e) {
      console.warn('Failed to remove time feature flags from localStorage:', e)
    }
  }
}

/**
 * Проверить, включён ли конкретный флаг
 */
export function isTimeFeatureEnabled(flag: keyof TimeFeatureFlags): boolean {
  return currentFlags[flag] === true
}

/**
 * Получить статус всех feature flags для отображения в UI
 */
export function getTimeFeatureFlagsStatus(): Array<{
  key: keyof TimeFeatureFlags
  enabled: boolean
  description: string
}> {
  return [
    {
      key: 'periodHooksV2',
      enabled: currentFlags.periodHooksV2,
      description: 'Новая реализация оркестрации периодических callbacks',
    },
    {
      key: 'eventDedupV2',
      enabled: currentFlags.eventDedupV2,
      description: 'Улучшенная система дедупликации событий с instanceId',
    },
    {
      key: 'availabilityCacheV2',
      enabled: currentFlags.availabilityCacheV2,
      description: 'Кэширование доступности действий по worldVersion',
    },
    {
      key: 'strictPeriodProcessing',
      enabled: currentFlags.strictPeriodProcessing,
      description: 'Строгий режим обработки периодов с обработкой ошибок',
    },
    {
      key: 'timeDiagnostics',
      enabled: currentFlags.timeDiagnostics,
      description: 'Включение диагностики и метрик производительности',
    },
    {
      key: 'deterministicReplay',
      enabled: currentFlags.deterministicReplay,
      description: 'Детерминированный replay для отладки багов времени',
    },
  ]
}

// Инициализация: загружаем флаги из localStorage при импорте модуля
if (typeof window !== 'undefined') {
  loadTimeFeatureFlags()
}
