import type { ComputedRef, Ref } from 'vue'

import { getAllActions } from '@/domain/balance/actions'

import type { BalanceAction } from '@/domain/balance/actions/types'

import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'

import { createCalendarPlan, getScheduledWorkHours } from '@/domain/game-world/calendar'
import type { CalendarDayPlan } from '@/domain/game-world/calendar'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'

import type { GameEvent } from '@/stores/events-store/events-store.types'

import { useGameStore } from '@/stores/game.store'

import { useCalendarPlanStore } from '@/stores/calendar-plan-store'

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
  const calendarStore = useCalendarPlanStore()
  const plan: ComputedRef<DayPlanInput> = computed<DayPlanInput>(() => calendarStore.plan.days[0] ?? {
    sleepHours: 7,
    workHours: 0,
    actionIds: [],
  })
  const result: Ref<DayPlanResult | null> = ref<DayPlanResult | null>(null)

  const time = useTime()

  const eventsStore = useEventsStore()

  const pendingEventsCount: ComputedRef<number> = computed(() => getPendingEventsCount(eventsStore))

  const sleepHoursSupported: ComputedRef<boolean> = computed<boolean>(() => plan.value.sleepHours === 0
    || getAllActions().some((action: BalanceAction) => action.actionType === 'sleep' && action.hourCost === plan.value.sleepHours))

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

  function addFreeAction(actionId: string): boolean {
    const action: BalanceAction | undefined = getAllActions().find((candidate: BalanceAction) => candidate.id === actionId)
    const actionHours: number = action?.hourCost ?? Number.NaN

    if (!action || action.actionType === 'sleep' || action.actionType === 'work' || !Number.isFinite(actionHours)) return false

    if (plannedHours.value + actionHours > time.dayHoursRemaining.value) return false

    calendarStore.addAction(0, actionId)
    return true
  }

  function removeFreeActionAt(index: number): void {
    calendarStore.removeAction(0, index)
  }

  function setSleepHours(hours: number): void {
    calendarStore.setSleepHours(0, hours)
  }

  function setWorkHours(hours: number): void {
    calendarStore.setPlan({
      days: calendarStore.plan.days.map((day: DayPlanInput, dayIndex: number) => dayIndex === 0
        ? { ...day, workHours: Math.max(0, hours) }
        : day),
    })
  }

  function resetPlan(): void {
    calendarStore.reset()
    result.value = null
  }

  function clearResult(): void {
    result.value = null
  }

  async function confirmDay(): Promise<DayPlanResult | null> {
    if (!canConfirm.value) return null

    const gameStore = useGameStore()

    result.value = await gameStore.planDayAsync({ ...plan.value, actionIds: [...plan.value.actionIds] })

    if (result.value?.success) {
      const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
      const replacementDay: CalendarDayPlan = {
        ...createCalendarPlan(1).days[0]!,
        workHours: getScheduledWorkHours(world, calendarStore.plan.days.length - 1),
      }

      calendarStore.advanceAfterDay(calendarStore.plan.days.length, replacementDay)
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
    addFreeAction,
    removeFreeActionAt,
    setSleepHours,
    setWorkHours,
    resetPlan,
    clearResult,
    confirmDay,
  }
}

export type { UseDayPlanner } from './useDayPlanner.types'

export type { DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
