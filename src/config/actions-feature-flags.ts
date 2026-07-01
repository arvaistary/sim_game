/**
 * Feature Flags для actions-системы
 * Позволяют поэтапно включать новые функциональности
 */

import type { ActionsFeatureFlags, FeatureFlagStatusEntry } from './actions-feature-flags.types'

export type { ActionsFeatureFlags, FeatureFlagStatusEntry } from './actions-feature-flags.types'

/**
 * Конфигурация feature flags по умолчанию
 * В production все флаги включены для максимальной функциональности
 */
export const DEFAULT_ACTIONS_FEATURE_FLAGS: ActionsFeatureFlags = {
  schemaV2: false, // TODO: реализовать schema validation
  engineReasonsV2: true, // Реализовано: reason codes в canExecute
  financeUnifiedV2: false, // TODO: мигрировать finance в actions-store
  eventIngressIntegration: false, // TODO: перейти на EventIngress
  needsValidation: false, // TODO: добавить needs проверки
  antiGrind: false, // TODO: добавить anti-grind механизмы
}

/**
 * Текущая конфигурация feature flags
 * Может быть переопределена через localStorage или конфигурацию
 */
let currentFlags: ActionsFeatureFlags = { ...DEFAULT_ACTIONS_FEATURE_FLAGS }

/**
 * Получить текущие feature flags.
 * @description [Config] - возвращает копию текущей конфигурации feature flags для actions-системы.
 * @return { ActionsFeatureFlags } копия текущих флагов
 */
export function getActionsFeatureFlags(): ActionsFeatureFlags {
  return { ...currentFlags }
}

/**
 * Установить feature flags.
 * @description [Config] - обновляет указанные флаги и сохраняет результат в localStorage.
 * @return { void }
 */
export function setActionsFeatureFlags(flags: Partial<ActionsFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('actionsFeatureFlags', JSON.stringify(currentFlags))
    } catch (e) {
      console.warn('Failed to save actions feature flags to localStorage:', e)
    }
  }
}

/**
 * Загрузить feature flags из localStorage.
 * @description [Config] - читает сохранённые флаги из localStorage и обновляет текущую конфигурацию.
 * @return { void }
 */
export function loadActionsFeatureFlags(): void {

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved: string | null = localStorage.getItem('actionsFeatureFlags')

      if (saved) {
        const parsed: Partial<ActionsFeatureFlags> = JSON.parse(saved) as Partial<ActionsFeatureFlags>
        currentFlags = { ...DEFAULT_ACTIONS_FEATURE_FLAGS, ...parsed }
      }
    } catch (e) {
      console.warn('Failed to load actions feature flags from localStorage:', e)
    }
  }
}

/**
 * Сбросить feature flags к значениям по умолчанию.
 * @description [Config] - сбрасывает все флаги к DEFAULT_ACTIONS_FEATURE_FLAGS и удаляет запись из localStorage.
 * @return { void }
 */
export function resetActionsFeatureFlags(): void {
  currentFlags = { ...DEFAULT_ACTIONS_FEATURE_FLAGS }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('actionsFeatureFlags')
    } catch (e) {
      console.warn('Failed to remove actions feature flags from localStorage:', e)
    }
  }
}

/**
 * Проверить, включён ли конкретный флаг.
 * @description [Config] - проверяет, что указанный флаг установлен в true.
 * @return { boolean } true если флаг включён
 */
export function isActionsFeatureEnabled(flag: keyof ActionsFeatureFlags): boolean {
  return currentFlags[flag] === true
}

/**
 * Получить статус всех feature flags для отображения в UI.
 * @description [Config] - формирует массив объектов с ключом, статусом и описанием каждого флага.
 * @return { FeatureFlagStatusEntry[] } массив статусов флагов
 */
export function getActionsFeatureFlagsStatus(): FeatureFlagStatusEntry[] {
  return [
    {
      key: 'schemaV2',
      enabled: currentFlags.schemaV2,
      description: 'Валидация action schema',
    },
    {
      key: 'engineReasonsV2',
      enabled: currentFlags.engineReasonsV2,
      description: 'Machine-readable reason codes для отказов',
    },
    {
      key: 'financeUnifiedV2',
      enabled: currentFlags.financeUnifiedV2,
      description: 'Единый контур для finance действий',
    },
    {
      key: 'eventIngressIntegration',
      enabled: currentFlags.eventIngressIntegration,
      description: 'Публикация событий через EventIngress',
    },
    {
      key: 'needsValidation',
      enabled: currentFlags.needsValidation,
      description: 'Проверка needs/энергии в доступности',
    },
    {
      key: 'antiGrind',
      enabled: currentFlags.antiGrind,
      description: 'Защита от спама действий',
    },
  ]
}

// Инициализация: загружаем флаги из localStorage при импорте модуля
if (typeof window !== 'undefined') {
  loadActionsFeatureFlags()
}
