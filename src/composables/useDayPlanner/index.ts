import { getAllActions } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions/types'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'
import type { GameEvent } from '@/stores/events-store/events-store.types'
import { useGameStore } from '@/stores/game.store'
import { useEventsStore } from '@/stores/events-store'
import { getPendingEventsCount } from '@/stores/events-store/pending-events-count'
import { useEventModal } from '@/composables/useEventModal'
import { useTime } from '@/composables/useTime'
import type { UseDayPlanner } from './useDayPlanner.types'

const DEFAULT_SLEEP_HOURS: number = 7
const IMMEDIATE_EVENT_TYPES: ReadonlySet<string> = new Set<string>(['work', 'micro'])

const plan: Ref<DayPlanInput> = ref<DayPlanInput>({ sleepHours: DEFAULT_SLEEP_HOURS, workHours: 0, actionIds: [] })
const result: Ref<DayPlanResult | null> = ref<DayPlanResult | null>(null)

/**
 * Управлять черновиком и подтверждением плана игрового дня.
 * @description [Composable] - хранит неперсистентный план и делегирует исполнение game store.
 * @return { UseDayPlanner } состояние и команды планировщика
 */
export function useDayPlanner(): UseDayPlanner {
  const time = useTime()
  const eventsStore = useEventsStore()

  const pendingEventsCount: ComputedRef<number> = computed(() => getPendingEventsCount(eventsStore))

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

  const hasDeferredEventBadge: ComputedRef<boolean> = computed<boolean>(() => {
    const hasPending: boolean = eventsStore.hasPendingEvents

    if (!hasPending) return false

    const head: GameEvent | null = eventsStore.currentEvent ?? eventsStore.nextEvent

    if (!head) return hasPending

    return !IMMEDIATE_EVENT_TYPES.has(head.type)
  })

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

    const { openEventModal } = useEventModal()
    const nextEvent: GameEvent | null = eventsStore.nextEvent ?? eventsStore.currentEvent

    if (nextEvent && IMMEDIATE_EVENT_TYPES.has(nextEvent.type)) {
      if (!eventsStore.currentEvent) eventsStore.showNextEvent()
      openEventModal()
    }

    return result.value
  }

  return {
    plan,
    result,
    canConfirm,
    sleepDebtWarning,
    hasDeferredEventBadge,
    pendingEventsCount,
    getActionTitle,
    addFreeAction,
    removeFreeAction,
    setSleepHours,
    setWorkHours,
    resetPlan,
    confirmDay,
  }
}

export type { UseDayPlanner } from './useDayPlanner.types'
export type { DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
