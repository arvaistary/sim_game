import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'

export interface UseDayPlanner {
  plan: Readonly<Ref<DayPlanInput>>
  result: Readonly<Ref<DayPlanResult | null>>
  canConfirm: ComputedRef<boolean>
  sleepDebtWarning: ComputedRef<boolean>
  getActionTitle(actionId: string): string
  addFreeAction(actionId: string): boolean
  removeFreeAction(actionId: string): void
  setSleepHours(hours: number): void
  setWorkHours(hours: number): void
  resetPlan(): void
  confirmDay(): Promise<DayPlanResult | null>
}
