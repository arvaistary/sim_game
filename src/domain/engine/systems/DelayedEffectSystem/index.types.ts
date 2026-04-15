import type { StatChanges } from '@/domain/balance/types'

/** Запись об отложенном последствии */
export interface DelayedEffectEntry {
  /** Уникальный ID записи */
  id: string
  /** ID события-источника */
  sourceEventId: string
  /** Возраст персонажа, при котором последствие срабатывает */
  triggerAge: number
  /** Описание что произойдёт (для UI) */
  description: string
  /** Изменения характеристик при срабатывании */
  statChanges?: StatChanges
  /** Изменения навыков при срабатывании */
  skillChanges?: Record<string, number>
  /** ID черты характера, которую даёт при срабатывании */
  grantTrait?: string
  /** ID памяти, которую оставляет (интеграция с LifeMemorySystem) */
  memoryId?: string
  /** Флаг: последствие уже применено */
  triggered: boolean
}

/** Структура компонента delayed_effects */
export interface DelayedEffectsComponent {
  pending: DelayedEffectEntry[]
}
