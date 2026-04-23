/**
 * Feature flags для event system
 * 
 * Используются для постепенного включения новых функций event system v2
 */

export interface EventFeatureFlags {
  // Включает новый EventIngress API вместо queuePendingEvent
  ingressV2: boolean
  
  // Включает улучшенный dedup с period guards
  dedupV2: boolean
  
  // Включает новый формат payload с instanceId
  payloadV2: boolean
  
  // Включает diagnostics и метрики
  diagnosticsEnabled: boolean
  
  // Включает bounded индекс для O(1) dedup
  boundedDedupIndex: boolean
  
  // Включает period dedup guards
  periodDedupGuards: boolean
}

/**
 * Конфигурация feature flags по умолчанию
 */
export const DEFAULT_EVENT_FEATURE_FLAGS: EventFeatureFlags = {
  ingressV2: true,
  dedupV2: true,
  payloadV2: true,
  diagnosticsEnabled: true,
  boundedDedupIndex: true,
  periodDedupGuards: true,
}

/**
 * Текущие feature flags (можно переопределить через localStorage или env)
 */
let currentFlags: EventFeatureFlags = { ...DEFAULT_EVENT_FEATURE_FLAGS }

/**
 * Получает текущие feature flags
 * @returns Feature flags
 */
export function getEventFeatureFlags(): EventFeatureFlags {
  return { ...currentFlags }
}

/**
 * Устанавливает feature flags
 * @param flags - Новые значения flags
 */
export function setEventFeatureFlags(flags: Partial<EventFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags }
}

/**
 * Сбрасывает feature flags к значениям по умолчанию
 */
export function resetEventFeatureFlags(): void {
  currentFlags = { ...DEFAULT_EVENT_FEATURE_FLAGS }
}

/**
 * Проверяет, включён ли конкретный feature flag
 * @param flag - Имя флага
 * @returns true если флаг включён
 */
export function isEventFeatureEnabled<K extends keyof EventFeatureFlags>(
  flag: K,
): boolean {
  return currentFlags[flag]
}

/**
 * Загружает feature flags из localStorage
 */
export function loadEventFeatureFlagsFromStorage(): void {
  try {
    const stored = localStorage.getItem('eventFeatureFlags')
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<EventFeatureFlags>
      currentFlags = { ...DEFAULT_EVENT_FEATURE_FLAGS, ...parsed }
    }
  } catch (error) {
    console.warn('Failed to load event feature flags from storage:', error)
  }
}

/**
 * Сохраняет feature flags в localStorage
 */
export function saveEventFeatureFlagsToStorage(): void {
  try {
    localStorage.setItem('eventFeatureFlags', JSON.stringify(currentFlags))
  } catch (error) {
    console.warn('Failed to save event feature flags to storage:', error)
  }
}

/**
 * Инициализирует feature flags
 */
export function initEventFeatureFlags(): void {
  loadEventFeatureFlagsFromStorage()
}

// Автоматическая инициализация при импорте модуля
if (typeof window !== 'undefined') {
  initEventFeatureFlags()
}
