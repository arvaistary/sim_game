/**
 * Типы результатов domain commands (ADR-0005, Фаза 2).
 *
 * Команды мутируют GameWorld и возвращают result-модель.
 * Signature: (world: GameWorld, params) => CommandResult.
 */
import type { StatChangeBreakdownEntry } from '@/domain/balance/types'

/** Базовый результат команды. */
export interface CommandResult {
  success: boolean
  message: string
}

/** Результат executeAction — с расширенной информацией для UI (breakdown по статам). */
export interface ExecuteActionResult extends CommandResult {
  /** Сколько денег потрачено (для UI). */
  moneySpent?: number
  /** Сколько часов потрачено (для UI). */
  hoursSpent?: number
  /** Разбор изменений статов для UI (опционально). */
  statBreakdown?: StatChangeBreakdownEntry[]
}

/** Результат simulateWorkShift. */
export interface WorkShiftResult extends CommandResult {
  /** Фактически заработано (после salaryMultiplier). */
  earnedAmount: number
  /** Сколько часов отработано. */
  hoursWorked: number
}

/** Причина отклонения команды (для UI-сообщений и tests). */
export type CommandRejectionReason =
  | 'not_found'
  | 'no_money'
  | 'no_time'
  | 'min_age'
  | 'min_skill'
  | 'not_employed'
  | 'no_event'
  | 'choice_not_found'

/** Требования к действию (domain-зеркало application/game/index.types.ActionRequirements). */
export interface DomainActionRequirements {
  minAge?: number
  minSkills?: Record<string, number>
}

/** Минимальный набор полей GameEvent для domain-обработки (без UI-only полей). */
export interface GameEventPayload {
  id: string
  title: string
  choices?: EventChoicePayload[]
}

/** Минимальный набор полей EventChoice для domain-обработки. */
export interface EventChoicePayload {
  id: string
  text: string
  effects?: Record<string, number>
  outcome?: string
}

/** Результат resolveEventDecision. */
export interface ResolveEventResult extends CommandResult {
  /** Текст выбора (для UI). */
  choiceText?: string
  /** Описание outcome (для UI). */
  outcome?: string
}
