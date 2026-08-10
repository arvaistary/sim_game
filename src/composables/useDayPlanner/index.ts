import { storeToRefs } from 'pinia'

import { getAllActions } from '@/domain/balance/actions'

import type { BalanceAction } from '@/domain/balance/actions/types'

import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'

import type { DayPlanResult } from '@/domain/game-world/commands/commands.types'

import type { GameEvent } from '@/stores/events-store/events-store.types'

import { useGameStore } from '@/stores/game.store'

import { useDayPlannerStore } from '@/stores/day-planner-store'

import { useEventsStore } from '@/stores/events-store'

import { getPendingEventsCount } from '@/stores/events-store/pending-events-count'

import { useEventModal } from '@/composables/useEventModal'

import { useTime } from '@/composables/useTime'

import type { UseDayPlanner } from './useDayPlanner.types'

const IMMEDIATE_EVENT_TYPES: ReadonlySet<string> = new Set<string>(['work', 'micro'])

function getActionHourCost(actionId: string): number {
  const action: BalanceAction | undefined = getAllActions().find((candidate: BalanceAction) => candidate.id === actionId)

  return action?.hourCost ?? Number.NaN
}

/**
 * Управлять черновиком и подтверждением плана игрового дня.
 * @description [Composable] - читает Pinia store и делегирует исполнение game store.
 * @return { UseDayPlanner } состояние и команды планировщика
 */
export function useDayPlanner(): UseDayPlanner {
  const dayPlannerStore = useDayPlannerStore()

  const { plan, result } = storeToRefs(dayPlannerStore)

  const time = useTime()

  const eventsStore = useEventsStore()

  const pendingEventsCount: ComputedRef<number> = computed(() => getPendingEventsCount(eventsStore))

  const sleepHoursSupported: ComputedRef<boolean> = computed<boolean>(() => getAllActions().some((action: BalanceAction) => action.actionType === 'sleep' && action.hourCost === plan.value.sleepHours))

  const plannedActionHours: ComputedRef<number> = computed<number>(() => plan.value.actionIds.reduce(
    (sum: number, id: string) => sum + getActionHourCost(id),
    0,
  ))

  const plannedHours: ComputedRef<number> = computed<number>(() => plan.value.sleepHours + (plan.value.workHours ?? 0) + plannedActionHours.value)

  const freeActionHoursBudget: ComputedRef<number> = computed<number>(() => {
    const workHours: number = plan.value.workHours ?? 0

    return Math.max(0, time.dayHoursRemaining.value - plan.value.sleepHours - workHours)
  })

  const freeActionHoursRemaining: ComputedRef<number> = computed<number>(() => Math.max(0, freeActionHoursBudget.value - plannedActionHours.value))

  const canConfirm: ComputedRef<boolean> = computed<boolean>(() => {
    const workHours: number = plan.value.workHours ?? 0

    return sleepHoursSupported.value
      && Number.isFinite(workHours)
      && workHours >= 0
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

  async function confirmDay(): Promise<DayPlanResult | null> {
    if (!canConfirm.value) return null

    const gameStore = useGameStore()

    result.value = await gameStore.planDayAsync({ ...plan.value, actionIds: [...plan.value.actionIds] })

    if (result.value?.success) {
      dayPlannerStore.resetDraft()
    }

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
    plannedActionHours,
    freeActionHoursBudget,
    freeActionHoursRemaining,
    sleepDebtWarning,
    hasDeferredEventBadge,
    pendingEventsCount,
    getActionTitle,
    addFreeAction: dayPlannerStore.addFreeAction,
    removeFreeActionAt: dayPlannerStore.removeFreeActionAt,
    setSleepHours: dayPlannerStore.setSleepHours,
    setWorkHours: dayPlannerStore.setWorkHours,
    resetPlan: dayPlannerStore.resetPlan,
    clearResult: dayPlannerStore.clearResult,
    confirmDay,
  }
}

export type { UseDayPlanner } from './useDayPlanner.types'

export type { DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
