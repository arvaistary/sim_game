import type { StatsData } from '@/domain/balance/constants/default-save'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'

/** План периода: индекс массива — смещение дня от текущего. */
export interface CalendarPlan {
  days: CalendarDayPlan[]
}

/** План одного дня с UI-метаданными закреплённых карточек. */
export interface CalendarDayPlan extends DayPlanInput {
  pinnedActionIndexes?: number[]
}

/** Прогноз одного дня календаря. */
export interface CalendarDayForecast {
  dayOffset: number
  startStats: StatsData
  endStats: StatsData
  result: DayPlanResult
}

/** Итог выполнения или прогноза периода. */
export interface CalendarRunResult {
  success: boolean
  completedDays: number
  days: CalendarDayForecast[]
}

/** Результат проверки изменения плана календаря. */
export interface CalendarValidationResult {
  success: boolean
  message: string
}

/** Входные данные подписи закрытого дня календаря. */
export interface CalendarLockCopyInput {
  skillLabel: string
  unlockLevel: number
  currentLevel: number
}

/** Подпись закрытого дня: навык, а не уровень персонажа. */
export interface CalendarLockCopy {
  title: string
  requirement: string
  progress: string
}
