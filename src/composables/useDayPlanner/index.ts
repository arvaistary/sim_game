import { getAllActions } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions/types'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'
import { useGameStore } from '@/stores/game.store'
import { useTime } from '@/composables/useTime'
import type { UseDayPlanner } from './useDayPlanner.types'

const DEFAULT_SLEEP_HOURS: number = 7

const plan: Ref<DayPlanInput> = ref<DayPlanInput>({ sleepHours: DEFAULT_SLEEP_HOURS, workHours: 0, actionIds: [] })
const result: Ref<DayPlanResult | null> = ref<DayPlanResult | null>(null)

/**
 * Управлять черновиком и подтверждением плана игрового дня.
 * @description [Composable] - хранит неперсистентный план и делегирует выполнение game store.
 * @return { UseDayPlanner } состояние и команды планировщика
 */
export function useDayPlanner(): UseDayPlanner {
  const time = useTime()

  const sleepHoursSupported: ComputedRef<boolean> = computed<boolean>(() => getAllActions().some((action: BalanceAction) => action.actionType === 'sleep' && action.hourCost === plan.value.sleepHours))
  const plannedActionHours: ComputedRef<number> = computed<number>(() => plan.value.actionIds.reduce((sum: number, id: string) => sum + (getAllActions().find((action: BalanceAction) => action.id === id)?.hourCost ?? Number.NaN), 0))
  const plannedHours: ComputedRef<number> = computed<number>(() => plan.value.sleepHours + (plan.value.workHours ?? 0) + plannedActionHours.value)
  const canConfirm: ComputedRef<boolean> = computed<boolean>(() => {
    const workHours: number = plan.value.workHours ?? 0

    return sleepHoursSupported.value
      && Number.isFinite(workHours)
      && workHours >= 0
      && plan.value.actionIds.length <= 3
      && Number.isFinite(plannedActionHours.value)
      && plannedHours.value <= time.dayHoursRemaining.value
  })
  const sleepDebtWarning: ComputedRef<boolean> = computed<boolean>(() => plan.value.sleepHours < BALANCE_CONSTANTS.SLEEP_HOURS_RECOMMENDED && time.sleepDebt.value >= 70)

  function getActionTitle(actionId: string): string {
    return getAllActions().find((action: BalanceAction) => action.id === actionId)?.title ?? actionId
  }

  function addFreeAction(actionId: string): boolean {
    const action: BalanceAction | undefined = getAllActions().find((candidate: BalanceAction) => candidate.id === actionId)

    if (!action || action.actionType === 'sleep' || action.actionType === 'work' || plan.value.actionIds.length >= 3 || plan.value.actionIds.includes(actionId)) return false
    plan.value = { ...plan.value, actionIds: [...plan.value.actionIds, actionId] }
    return true
  }

  function removeFreeAction(actionId: string): void {
    plan.value = { ...plan.value, actionIds: plan.value.actionIds.filter(id => id !== actionId) }
  }

  function setSleepHours(hours: number): void {
    plan.value = { ...plan.value, sleepHours: hours }
  }

  function setWorkHours(hours: number): void {
    plan.value = { ...plan.value, workHours: Math.max(0, hours) }
  }

  function resetPlan(): void {
    plan.value = { sleepHours: DEFAULT_SLEEP_HOURS, workHours: 0, actionIds: [] }
    result.value = null
  }

  async function confirmDay(): Promise<DayPlanResult | null> {
    if (!canConfirm.value) return null
    const gameStore = useGameStore()
    result.value = await gameStore.planDayAsync({ ...plan.value, actionIds: [...plan.value.actionIds] })
    return result.value
  }

  return { plan, result, canConfirm, sleepDebtWarning, getActionTitle, addFreeAction, removeFreeAction, setSleepHours, setWorkHours, resetPlan, confirmDay }
}

export type { UseDayPlanner } from './useDayPlanner.types'
export type { DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
