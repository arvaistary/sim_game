import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'



export interface UseDayPlanner {

  plan: Readonly<Ref<DayPlanInput>>

  result: Readonly<Ref<DayPlanResult | null>>

  canConfirm: ComputedRef<boolean>

  /** Суммарные часы свободных действий в черновике плана. */

  plannedActionHours: ComputedRef<number>

  /** Бюджет часов под свободные действия после сна и работы. */

  freeActionHoursBudget: ComputedRef<number>

  /** Оставшиеся часы под свободные действия в черновике плана. */

  freeActionHoursRemaining: ComputedRef<number>

  sleepDebtWarning: ComputedRef<boolean>

  /** Ненавязчивый индикатор отложенных (не work/micro) событий в очереди. */

  hasDeferredEventBadge: ComputedRef<boolean>

  pendingEventsCount: ComputedRef<number>

  getActionTitle(actionId: string): string

  addFreeAction(actionId: string): boolean

  removeFreeActionAt(index: number): void

  setSleepHours(hours: number): void

  setWorkHours(hours: number): void

  resetPlan(): void

  clearResult(): void

  confirmDay(): Promise<DayPlanResult | null>

}

