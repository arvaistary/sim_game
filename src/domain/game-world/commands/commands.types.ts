/**
 * Типы результатов domain commands (ADR-0005, Фаза 2).
 *
 * Команды мутируют GameWorld и возвращают result-модель.
 * Signature: (world: GameWorld, params) => CommandResult.
 */
import type { StatChangeBreakdownEntry, StatChanges } from '@/domain/balance/types'
import type { EventChoiceCanonical } from '@/domain/balance/constants/event-choice.types'

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

export interface DayPlanInput {
  sleepHours: number
  workHours?: number
  actionIds: string[]
}

export interface DayPlanStepResult {
  kind: 'sleep' | 'work' | 'action' | 'idle'
  actionId?: string
  success: boolean
  message: string
  hoursSpent: number
  /** Заработок успешной рабочей смены (для event.data.earnedAmount). */
  earnedAmount?: number
}

/** Контекст day-роллов событий (work/micro). Без age-полей. */
export interface EventRollContext {
  dayResult: DayPlanResult
}

export interface DayPlanResult {
  success: boolean
  message: string
  steps: DayPlanStepResult[]
  statChanges: StatChanges
  moneyDelta: number
  plannedHours: number
  idleHours: number
  totalHoursSpent: number
  dayNumber: number
  crossedWeekBoundary: boolean
  crossedMonthBoundary: boolean
  crossedYearBoundary: boolean
  ageChanged: boolean
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
  requiresCompletedProgramId?: string
}

/** Минимальный набор полей GameEvent для domain-обработки (без UI-only полей). */
export interface GameEventPayload {
  id: string
  instanceId?: string
  title: string
  choices?: EventChoicePayload[]
  data?: Record<string, unknown>
}

/** Минимальный набор полей EventChoice для domain-обработки. */
export type EventChoicePayload = EventChoiceCanonical

/** Результат resolveEventDecision. */
export interface ResolveEventResult extends CommandResult {
  /** Текст выбора (для UI). */
  choiceText?: string
  /** Описание outcome (для UI). */
  outcome?: string
}
