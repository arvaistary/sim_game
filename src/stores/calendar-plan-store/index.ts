import type { Ref } from 'vue'
import { advanceCalendarPlan, createCalendarPlan } from '@/domain/game-world/calendar'
import type { CalendarDayPlan, CalendarPlan, CalendarPlanStoreState } from './calendar-plan-store.types'

export type { CalendarDayPlan, CalendarPlan, DayPlanInput } from './calendar-plan-store.types'

function isPinnedActionIndexes(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.every((index: unknown) => typeof index === 'number' && Number.isInteger(index) && index >= 0)
}

function getPinnedActionIndexes(day: CalendarDayPlan): number[] {
  return [...(day.pinnedActionIndexes ?? [])]
}

function setPinnedActionIndexes(day: CalendarDayPlan, indexes: number[]): void {
  const normalized: number[] = [...new Set(indexes)].sort((first: number, second: number) => first - second)
  day.pinnedActionIndexes = normalized.length > 0 ? normalized : undefined
}

function cloneDayPlan(day: CalendarDayPlan): CalendarDayPlan {
  const pinnedActionIndexes: number[] = getPinnedActionIndexes(day).filter(
    (index: number) => index >= 0 && index < day.actionIds.length,
  )

  return pinnedActionIndexes.length > 0
    ? { ...day, actionIds: [...day.actionIds], pinnedActionIndexes }
    : { ...day, actionIds: [...day.actionIds] }
}

function isDayPlanInput(value: unknown): value is CalendarDayPlan {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false

  const record: Record<string, unknown> = value as Record<string, unknown>

  return typeof record.sleepHours === 'number'
    && typeof record.workHours === 'number'
    && Array.isArray(record.actionIds)
    && record.actionIds.every((actionId: unknown) => typeof actionId === 'string')
    && (record.pinnedActionIndexes === undefined || isPinnedActionIndexes(record.pinnedActionIndexes))
}

export const useCalendarPlanStore = defineStore('calendarPlan', (): CalendarPlanStoreState & {
  setPlan(plan: CalendarPlan): void
  setSleepHours(dayOffset: number, hours: number): void
  addAction(dayOffset: number, actionId: string): void
  duplicateAction(dayOffset: number, actionIndex: number): void
  togglePin(dayOffset: number, actionIndex: number): void
  moveAction(sourceDay: number, actionIndex: number, targetDay: number): void
  removeAction(dayOffset: number, actionIndex: number): void
  copyDay(sourceDay: number, targetDays: number[]): void
  advanceAfterDay(dayCount: number, replacementDay?: CalendarDayPlan): void
  save(): Record<string, unknown>
  load(data: Record<string, unknown>): void
  reset(): void
} => {
  const plan: Ref<CalendarPlan> = ref<CalendarPlan>(createCalendarPlan(1))

  function setPlan(nextPlan: CalendarPlan): void {
    plan.value = {
      days: nextPlan.days.map((day: CalendarDayPlan) => cloneDayPlan(day)),
    }
  }

  function addAction(dayOffset: number, actionId: string): void {
    const day: CalendarDayPlan | undefined = plan.value.days[dayOffset]

    if (!day || !actionId) return

    day.actionIds.push(actionId)
  }

  function setSleepHours(dayOffset: number, hours: number): void {
    const day: CalendarDayPlan | undefined = plan.value.days[dayOffset]

    if (!day || !Number.isFinite(hours) || hours < 0) return

    day.sleepHours = hours
  }

  function duplicateAction(dayOffset: number, actionIndex: number): void {
    const day: CalendarDayPlan | undefined = plan.value.days[dayOffset]
    const actionId: string | undefined = day?.actionIds[actionIndex]

    if (!day || !actionId) return

    const pinnedActionIndexes: number[] = getPinnedActionIndexes(day).map(
      (index: number) => index > actionIndex ? index + 1 : index,
    )

    if (pinnedActionIndexes.includes(actionIndex)) pinnedActionIndexes.push(actionIndex + 1)

    day.actionIds.splice(actionIndex + 1, 0, actionId)
    setPinnedActionIndexes(day, pinnedActionIndexes)
  }

  function togglePin(dayOffset: number, actionIndex: number): void {
    const day: CalendarDayPlan | undefined = plan.value.days[dayOffset]

    if (!day || actionIndex < 0 || actionIndex >= day.actionIds.length) return

    const pinnedActionIndexes: number[] = getPinnedActionIndexes(day)
    const pinnedIndex: number = pinnedActionIndexes.indexOf(actionIndex)

    if (pinnedIndex >= 0) pinnedActionIndexes.splice(pinnedIndex, 1)
    else pinnedActionIndexes.push(actionIndex)

    setPinnedActionIndexes(day, pinnedActionIndexes)
  }

  function moveAction(sourceDay: number, actionIndex: number, targetDay: number): void {
    const source: CalendarDayPlan | undefined = plan.value.days[sourceDay]
    const target: CalendarDayPlan | undefined = plan.value.days[targetDay]
    const actionId: string | undefined = source?.actionIds[actionIndex]

    if (!source || !target || !actionId || sourceDay === targetDay) return

    const sourcePinned: number[] = getPinnedActionIndexes(source)
    const movedPinned: boolean = sourcePinned.includes(actionIndex)
    setPinnedActionIndexes(source, sourcePinned
      .filter((index: number) => index !== actionIndex)
      .map((index: number) => index > actionIndex ? index - 1 : index))
    source.actionIds.splice(actionIndex, 1)
    const targetPinned: number[] = getPinnedActionIndexes(target)

    if (movedPinned) targetPinned.push(target.actionIds.length)
    target.actionIds.push(actionId)
    setPinnedActionIndexes(target, targetPinned)
  }

  function removeAction(dayOffset: number, actionIndex: number): void {
    const day: CalendarDayPlan | undefined = plan.value.days[dayOffset]

    if (!day || actionIndex < 0 || actionIndex >= day.actionIds.length) return

    const pinnedActionIndexes: number[] = getPinnedActionIndexes(day)
      .filter((index: number) => index !== actionIndex)
      .map((index: number) => index > actionIndex ? index - 1 : index)
    day.actionIds.splice(actionIndex, 1)
    setPinnedActionIndexes(day, pinnedActionIndexes)
  }

  function copyDay(sourceDay: number, targetDays: number[]): void {
    const source: CalendarDayPlan | undefined = plan.value.days[sourceDay]

    if (!source) return

    for (const targetDay of targetDays) {
      if (targetDay === sourceDay || !plan.value.days[targetDay]) continue

      plan.value.days[targetDay] = cloneDayPlan(source)
    }
  }

  function advanceAfterDay(dayCount: number, replacementDay?: CalendarDayPlan): void {
    plan.value = advanceCalendarPlan(plan.value, dayCount, replacementDay)
  }

  function save(): Record<string, unknown> {
    return {
      days: plan.value.days.map((day: CalendarDayPlan) => ({
        sleepHours: day.sleepHours,
        workHours: day.workHours ?? 0,
        actionIds: [...day.actionIds],
        ...(getPinnedActionIndexes(day).length > 0
          ? { pinnedActionIndexes: getPinnedActionIndexes(day) }
          : {}),
      })),
    }
  }

  function load(data: Record<string, unknown>): void {
    if (!Array.isArray(data.days)) return

    const days: CalendarDayPlan[] = data.days.filter(isDayPlanInput).map((day: CalendarDayPlan) => cloneDayPlan(day))

    if (days.length > 0) setPlan({ days })
  }

  function reset(): void {
    plan.value = createCalendarPlan(1)
  }

  return { plan, setPlan, setSleepHours, addAction, duplicateAction, togglePin, moveAction, removeAction, copyDay, advanceAfterDay, save, load, reset }
})
