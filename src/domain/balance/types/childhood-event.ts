import type { StatChanges } from '@domain/balance/types'
import { AgeGroup } from '@domain/balance/actions/types'

/** Тип события по значимости */
export type ChildhoodEventType = 'everyday' | 'formative' | 'fateful'

/** Отложенное последствие выбора */
export interface DelayedConsequence {
  /** Возраст когда последствие проявится (абсолютный) */
  triggerAge?: number
  /** Или: через сколько лет после события */
  yearsLater?: number
  /** Описание что произойдёт */
  description: string
  /** Изменения характеристик */
  statChanges?: StatChanges
  /** Изменения навыков */
  skillChanges?: Record<string, number>
  /** ID черты характера которую даёт */
  grantTrait?: string
  /** ID памяти которую оставляет */
  memoryId?: string
}

/** Вариант выбора в детском событии */
export interface ChildhoodEventChoice {
  /** Текст выбора для игрока */
  label: string
  /** Описание что происходит */
  description: string
  /** Немедленные изменения характеристик */
  statChanges?: StatChanges
  /** Немедленные изменения навыков */
  skillChanges?: Record<string, number>
  /** Мгновенная черта характера */
  grantTrait?: string
  /** Отложенные последствия (70% выборов имеют хотя бы одно) */
  delayedConsequences?: DelayedConsequence[]
  /** Требование навыка для доступности выбора */
  requiresSkill?: { key: string; minLevel: number }
  /** Скрытый выбор (виден только при определённых условиях) */
  hidden?: boolean
  /** Условие для отображения скрытого выбора */
  hiddenCondition?: { skill: string; minLevel: number }
}

/** Определение детского события */
export interface ChildhoodEventDef {
  /** Уникальный ID */
  id: string
  /** Заголовок */
  title: string
  /** Описание */
  description: string
  /** Возрастная группа */
  ageGroup: AgeGroup
  /** Тип по значимости */
  type: ChildhoodEventType
  /** Вероятность появления */
  probability: number
  /** Можно ли повторить */
  repeatable: boolean
  /** Варианты выбора */
  choices: ChildhoodEventChoice[]
  /** Условие появления (ID предыдущего события) */
  condition?: string
  /** Тег для цепочки */
  chainTag?: string
}
