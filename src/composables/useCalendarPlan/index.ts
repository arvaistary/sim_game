import type { ComputedRef, Ref } from 'vue'
import { storeToRefs } from 'pinia'
import {
  createCalendarPlan,
  forecastCalendarPlan,
  getCalendarHorizon,
  getCalendarLockCopy,
  getCalendarUnlockLevel,
  getScheduledWorkHours,
  validateCalendarDay,
} from '@/domain/game-world/calendar'
import type {
  CalendarDayForecast,
  CalendarDayPlan,
  CalendarLockCopy,
  CalendarPlan,
  CalendarRunResult,
  CalendarValidationResult,
} from '@/domain/game-world/calendar'
import { getSkillByKey } from '@/domain/balance/constants/skills-constants'
import type { StatDef, StatKey } from '@/domain/balance/types'
import type { BalanceAction } from '@/domain/balance/actions/types'
import { getAllActions } from '@/domain/balance/actions'
import { STAT_DEFS } from '@/domain/balance/constants/stat-defs'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { useCalendarPlanStore } from '@/stores/calendar-plan-store'
import { useGameStore } from '@/stores/game.store'
import { useSkillsStore } from '@/stores/skills-store'
import type { DayPlanInput, DayPlanResult } from '@/domain/game-world/commands/commands.types'
import type {
  CalendarActionCategory,
  CalendarDayView,
  DragSource,
  UseCalendarPlan,
} from './useCalendarPlan.types'

export type { CalendarActionCategory, CalendarDayView, DragSource, UseCalendarPlan } from './useCalendarPlan.types'
export { useCalendarPlanActions } from './useCalendarPlanActions'
export type { UseCalendarPlanActions } from './useCalendarPlan.types'

const WEEKDAYS: Array<{ short: string, full: string }> = [
  { short: 'Пн', full: 'Понедельник' },
  { short: 'Вт', full: 'Вторник' },
  { short: 'Ср', full: 'Среда' },
  { short: 'Чт', full: 'Четверг' },
  { short: 'Пт', full: 'Пятница' },
  { short: 'Сб', full: 'Суббота' },
  { short: 'Вс', full: 'Воскресенье' },
]

const ACTION_CATEGORY_META: Record<string, CalendarActionCategory> = {
  shop: { key: 'shop', label: 'Магазин', icon: 'shop' },
  fun: { key: 'fun', label: 'Развлечения', icon: 'masks' },
  home: { key: 'home', label: 'Дом', icon: 'home' },
  social: { key: 'social', label: 'Соц. жизнь', icon: 'users' },
  education: { key: 'education', label: 'Обучение', icon: 'book' },
  finance: { key: 'finance', label: 'Финансы', icon: 'wallet' },
  career: { key: 'career', label: 'Работа', icon: 'briefcase' },
  hobby: { key: 'hobby', label: 'Хобби', icon: 'palette' },
  health: { key: 'health', label: 'Здоровье', icon: 'heart' },
  selfdev: { key: 'selfdev', label: 'Саморазвитие', icon: 'bolt' },
}

const INVERTED_STAT_KEYS: Set<StatKey> = new Set<StatKey>(['hunger', 'stress'])

/**
 * @description [Composable] - управляет календарным draft и его выполнением.
 * @return { UseCalendarPlan } реактивное состояние и действия календарного плана
 */
export function useCalendarPlan(): UseCalendarPlan {
  const calendarStore = useCalendarPlanStore()

  const gameStore = useGameStore()

  const skillsStore = useSkillsStore()

  const { plan } = storeToRefs(calendarStore)

  const isRunning: Ref<boolean> = ref<boolean>(false)
  const runMessage: Ref<string> = ref<string>('')
  const runMessageTone: Ref<'success' | 'error'> = ref<'success' | 'error'>('success')
  const dragOverDay: Ref<number | null> = ref<number | null>(null)
  const draggedAction: Ref<DragSource | null> = ref<DragSource | null>(null)
  const actionsById: Map<string, BalanceAction> = new Map(getAllActions().map((action: BalanceAction) => [action.id, action]))
  const statDefs: StatDef[] = STAT_DEFS
  const horizon: ComputedRef<number> = computed<number>(() => getCalendarHorizon(skillsStore.getSkillLevel('timeManagement')))
  const days: ComputedRef<CalendarDayView[]> = computed<CalendarDayView[]>(() => plan.value.days
    .slice(0, horizon.value)
    .map((dayPlan: CalendarDayPlan, dayOffset: number): CalendarDayView => toCalendarDayView(dayPlan, dayOffset, false)))
  const boardDays: ComputedRef<CalendarDayView[]> = computed<CalendarDayView[]>(() => {
    const placeholders: CalendarDayPlan[] = createCalendarPlan(7).days

    return placeholders.map((placeholder: CalendarDayPlan, dayOffset: number): CalendarDayView => days.value[dayOffset] ?? toCalendarDayView(placeholder, dayOffset, true))
  })
  const forecast: ComputedRef<CalendarRunResult> = computed<CalendarRunResult>(() => {
    const currentPlan: CalendarPlan = { days: days.value.map((day: CalendarDayView) => day.plan) }
    return forecastCalendarPlan(GameWorld.fromJSON(gameStore.getWorldState()), currentPlan)
  })
  const forecastByDay: ComputedRef<Record<number, CalendarDayForecast>> = computed<Record<number, CalendarDayForecast>>(() => Object.fromEntries(
    forecast.value.days.map((day: CalendarDayForecast) => [day.dayOffset, day]),
  ))

  onMounted(() => {
    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const extension: CalendarPlan = createCalendarPlan(horizon.value)
    const daysWithSchedule: CalendarDayPlan[] = extension.days.map(
      (day: CalendarDayPlan, dayOffset: number): CalendarDayPlan => {
        const existing: CalendarDayPlan | undefined = plan.value.days[dayOffset]

        return {
          ...(existing ?? day),
          workHours: getScheduledWorkHours(world, dayOffset),
          actionIds: [...(existing?.actionIds ?? day.actionIds)],
        }
      },
    )

    calendarStore.setPlan({ days: daysWithSchedule })
  })

  function removeAction(dayOffset: number, actionIndex: number): void {
    calendarStore.removeAction(dayOffset, actionIndex)
    runMessage.value = ''
  }

  function setSleepHours(dayOffset: number, hours: number): void {
    calendarStore.setSleepHours(dayOffset, hours)
    runMessage.value = ''
  }

  function togglePin(dayOffset: number, actionIndex: number): void {
    calendarStore.togglePin(dayOffset, actionIndex)
    runMessage.value = ''
  }

  function cloneCurrentPlan(): CalendarPlan {
    return {
      days: days.value.map((day: CalendarDayView): CalendarDayPlan => ({
        ...day.plan,
        actionIds: [...day.plan.actionIds],
      })),
    }
  }

  function showPlanError(message: string): void {
    runMessageTone.value = 'error'
    runMessage.value = message
  }

  function duplicateAction(dayOffset: number, actionIndex: number): void {
    const currentPlan: CalendarPlan = cloneCurrentPlan()
    const day: DayPlanInput | undefined = currentPlan.days[dayOffset]
    const actionId: string | undefined = day?.actionIds[actionIndex]

    if (!day || !actionId) return

    day.actionIds.splice(actionIndex + 1, 0, actionId)
    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const validation: CalendarValidationResult = validateCalendarDay(world, currentPlan, dayOffset, day)

    if (!validation.success) {
      showPlanError(validation.message)
      return
    }

    calendarStore.duplicateAction(dayOffset, actionIndex)
    runMessage.value = ''
  }

  function startDragging(dayOffset: number, actionIndex: number, event: DragEvent): void {
    draggedAction.value = { sourceDay: dayOffset, sourceIndex: actionIndex }
    event.dataTransfer?.setData('text/plain', `${dayOffset}:${actionIndex}`)

    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(dayOffset: number, event: DragEvent): void {
    if (!draggedAction.value || dayOffset >= horizon.value) return

    dragOverDay.value = dayOffset

    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  }

  function dropAction(targetDay: number): void {
    const source: DragSource | null = draggedAction.value
    draggedAction.value = null
    dragOverDay.value = null

    if (!source || source.sourceDay === targetDay || targetDay >= horizon.value) return

    const currentPlan: CalendarPlan = cloneCurrentPlan()
    const sourcePlan: DayPlanInput | undefined = currentPlan.days[source.sourceDay]
    const targetPlan: DayPlanInput | undefined = currentPlan.days[targetDay]
    const actionId: string | undefined = sourcePlan?.actionIds[source.sourceIndex]

    if (!sourcePlan || !targetPlan || !actionId) return

    sourcePlan.actionIds.splice(source.sourceIndex, 1)
    targetPlan.actionIds.push(actionId)

    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const validation: CalendarValidationResult = validateCalendarDay(world, currentPlan, targetDay, targetPlan)

    if (!validation.success) {
      showPlanError(validation.message)
      return
    }

    calendarStore.moveAction(source.sourceDay, source.sourceIndex, targetDay)
    runMessage.value = ''
  }

  function endDragging(): void {
    draggedAction.value = null
    dragOverDay.value = null
  }

  function getActionTitle(actionId: string): string {
    return actionsById.get(actionId)?.title ?? actionId
  }

  function getActionCategory(actionId: string): CalendarActionCategory {
    const category: string | undefined = actionsById.get(actionId)?.category
    return ACTION_CATEGORY_META[category ?? ''] ?? { key: 'other', label: 'Действие', icon: 'bolt' }
  }

  function getActionHours(actionId: string): string {
    return formatHours(actionsById.get(actionId)?.hourCost ?? 0)
  }

  function isPinned(day: CalendarDayView, actionIndex: number): boolean {
    return day.plan.pinnedActionIndexes?.includes(actionIndex) ?? false
  }

  function getDayLockCopy(unlockLevel: number): CalendarLockCopy {
    const skillLabel: string = getSkillByKey('timeManagement')?.label ?? 'Тайм-менеджмент'

    return getCalendarLockCopy({
      skillLabel,
      unlockLevel,
      currentLevel: skillsStore.getSkillLevel('timeManagement'),
    })
  }

  function toCalendarDayView(dayPlan: CalendarDayPlan, dayOffset: number, isLocked: boolean): CalendarDayView {
    const unlockLevel: number = getCalendarUnlockLevel(dayOffset)

    return {
      dayOffset,
      isLocked,
      unlockLevel,
      lockCopy: getDayLockCopy(unlockLevel),
      weekday: getWeekdayLabel(dayOffset),
      plan: dayPlan,
    }
  }

  function getWeekdayLabel(dayOffset: number): string {
    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const currentDayOfWeek: number = Math.max(1, Math.min(7, Math.floor(world.time.dayOfWeek)))
    const index: number = (currentDayOfWeek - 1 + dayOffset) % WEEKDAYS.length
    return WEEKDAYS[index]!.short
  }

  function getWeekdayFullLabel(dayOffset: number): string {
    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const currentDayOfWeek: number = Math.max(1, Math.min(7, Math.floor(world.time.dayOfWeek)))
    const index: number = (currentDayOfWeek - 1 + dayOffset) % WEEKDAYS.length
    return WEEKDAYS[index]!.full
  }

  function dayHours(day: CalendarDayView): number {
    return day.plan.sleepHours + (day.plan.workHours ?? 0) + day.plan.actionIds.reduce(
      (sum: number, actionId: string) => sum + (actionsById.get(actionId)?.hourCost ?? 0),
      0,
    )
  }

  function formatHours(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
  }

  function getForecastStatValue(forecastDay: CalendarDayForecast, key: StatKey): number {
    const rawValue: number = forecastDay.endStats[key]
    return INVERTED_STAT_KEYS.has(key) ? 100 - rawValue : rawValue
  }

  function getForecastStatDelta(forecastDay: CalendarDayForecast, key: StatKey): number {
    const startValue: number = INVERTED_STAT_KEYS.has(key) ? 100 - forecastDay.startStats[key] : forecastDay.startStats[key]
    return getForecastStatValue(forecastDay, key) - startValue
  }

  function getForecastStatAlert(forecastDay: CalendarDayForecast, key: StatKey): 'underflow' | 'overflow' | '' {
    const value: number = getForecastStatValue(forecastDay, key)

    if (value <= 0) return 'underflow'

    if (value >= 100) return 'overflow'
    return ''
  }

  async function runPeriod(): Promise<void> {
    if (isRunning.value) return

    isRunning.value = true
    runMessage.value = ''

    try {
      const plannedDayCount: number = Math.min(horizon.value, calendarStore.plan.days.length)

      for (let dayIndex: number = 0; dayIndex < plannedDayCount; dayIndex += 1) {
        const dayPlan: CalendarDayPlan | undefined = calendarStore.plan.days[0]

        if (!dayPlan) return

        const result: DayPlanResult = await gameStore.planDayAsync(dayPlan)

        if (!result.success) {
          runMessageTone.value = 'error'
          runMessage.value = `Период остановлен на дне ${dayIndex + 1}: ${result.message}`
          return
        }

        const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
        const replacementDay: CalendarDayPlan = {
          ...createCalendarPlan(1).days[0]!,
          workHours: getScheduledWorkHours(world, horizon.value - 1),
        }

        calendarStore.advanceAfterDay(horizon.value, replacementDay)
      }

      runMessageTone.value = 'success'
      runMessage.value = 'Период прожит'
    } finally {
      isRunning.value = false
    }
  }

  return {
    plan,
    horizon,
    boardDays,
    forecastByDay,
    statDefs,
    invertedStatKeys: INVERTED_STAT_KEYS,
    isRunning,
    runMessage,
    runMessageTone,
    dragOverDay,
    days,
    getActionTitle,
    getActionCategory,
    getActionHours,
    isPinned,
    getWeekdayFullLabel,
    dayHours,
    formatHours,
    getForecastStatValue,
    getForecastStatDelta,
    getForecastStatAlert,
    removeAction,
    setSleepHours,
    togglePin,
    duplicateAction,
    startDragging,
    handleDragOver,
    dropAction,
    endDragging,
    runPeriod,
  }
}
