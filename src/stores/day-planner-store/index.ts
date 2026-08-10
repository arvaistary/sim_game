import type { Ref } from 'vue'

import { getAllActions } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions/types'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'

import { useTimeStore } from '@/stores/time-store'

import type { DayPlannerStoreState } from './day-planner-store.types'

export type { DayPlanInput, DayPlanResult } from './day-planner-store.types'

const DEFAULT_SLEEP_HOURS: number = 7

function createDefaultPlan(): DayPlanInput {
  return { sleepHours: DEFAULT_SLEEP_HOURS, workHours: 0, actionIds: [] }
}

function getActionHourCost(actionId: string): number {
  const action: BalanceAction | undefined = getAllActions().find((candidate: BalanceAction) => candidate.id === actionId)

  return action?.hourCost ?? Number.NaN
}

function isDayPlanInput(value: unknown): value is DayPlanInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  const record: Record<string, unknown> = value as Record<string, unknown>

  return typeof record.sleepHours === 'number'
    && typeof record.workHours === 'number'
    && Array.isArray(record.actionIds)
    && record.actionIds.every((actionId: unknown) => typeof actionId === 'string')
}

export const useDayPlannerStore = defineStore('dayPlanner', (): DayPlannerStoreState & {
  addFreeAction(actionId: string): boolean
  removeFreeActionAt(index: number): void
  setSleepHours(hours: number): void
  setWorkHours(hours: number): void
  resetPlan(): void
  resetDraft(): void
  clearResult(): void
  getPlannedHours(): number
  save(): Record<string, unknown>
  load(data: Record<string, unknown>): void
  reset(): void
} => {
  const plan: Ref<DayPlanInput> = ref<DayPlanInput>(createDefaultPlan())
  const result: Ref<DayPlanResult | null> = ref<DayPlanResult | null>(null)

  function getPlannedHours(): number {
    const actionHours: number = plan.value.actionIds.reduce(
      (sum: number, actionId: string) => sum + getActionHourCost(actionId),
      0,
    )

    return plan.value.sleepHours + (plan.value.workHours ?? 0) + actionHours
  }

  function addFreeAction(actionId: string): boolean {
    const timeStore = useTimeStore()
    const action: BalanceAction | undefined = getAllActions().find((candidate: BalanceAction) => candidate.id === actionId)
    const actionHours: number = action?.hourCost ?? Number.NaN

    if (!action || action.actionType === 'sleep' || action.actionType === 'work' || !Number.isFinite(actionHours)) return false

    if (getPlannedHours() + actionHours > timeStore.dayHoursRemaining) return false

    plan.value = { ...plan.value, actionIds: [...plan.value.actionIds, actionId] }

    return true
  }

  function removeFreeActionAt(index: number): void {
    if (index < 0 || index >= plan.value.actionIds.length) return

    const actionIds: string[] = [...plan.value.actionIds]

    actionIds.splice(index, 1)
    plan.value = { ...plan.value, actionIds }
  }

  function setSleepHours(hours: number): void {
    plan.value = { ...plan.value, sleepHours: hours }
  }

  function setWorkHours(hours: number): void {
    plan.value = { ...plan.value, workHours: Math.max(0, hours) }
  }

  function resetPlan(): void {
    plan.value = createDefaultPlan()
    result.value = null
  }

  function resetDraft(): void {
    plan.value = createDefaultPlan()
  }

  function clearResult(): void {
    result.value = null
  }

  function save(): Record<string, unknown> {
    return {
      plan: {
        sleepHours: plan.value.sleepHours,
        workHours: plan.value.workHours ?? 0,
        actionIds: [...plan.value.actionIds],
      },
    }
  }

  function load(data: Record<string, unknown>): void {
    const rawPlan: unknown = data.plan

    if (!isDayPlanInput(rawPlan)) return

    plan.value = {
      sleepHours: rawPlan.sleepHours,
      workHours: rawPlan.workHours ?? 0,
      actionIds: [...rawPlan.actionIds],
    }
  }

  function reset(): void {
    plan.value = createDefaultPlan()
    result.value = null
  }

  return {
    plan,
    result,
    addFreeAction,
    removeFreeActionAt,
    setSleepHours,
    setWorkHours,
    resetPlan,
    resetDraft,
    clearResult,
    getPlannedHours,
    save,
    load,
    reset,
  }
})
