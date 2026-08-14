import type { Ref, ComputedRef } from 'vue'
import type { StatDef, StatKey } from '@/domain/balance/types'
import type {
  CalendarDayForecast,
  CalendarDayPlan,
  CalendarLockCopy,
  CalendarPlan,
} from '@/domain/game-world/calendar'

export type DragSource = { sourceDay: number, sourceIndex: number }

export interface CalendarDayView {
  dayOffset: number
  isLocked: boolean
  unlockLevel: number
  lockCopy: CalendarLockCopy
  weekday: string
  plan: CalendarDayPlan
}

export interface CalendarActionCategory {
  key: string
  label: string
  icon: string
}

export interface UseCalendarPlanActions {
  addAction(dayOffset: number, actionId: string): string | null
}

export interface UseCalendarPlan {
  plan: Ref<CalendarPlan>
  horizon: ComputedRef<number>
  boardDays: ComputedRef<CalendarDayView[]>
  forecastByDay: ComputedRef<Record<number, CalendarDayForecast>>
  statDefs: StatDef[]
  invertedStatKeys: Set<StatKey>
  isRunning: Ref<boolean>
  runMessage: Ref<string>
  runMessageTone: Ref<'success' | 'error'>
  dragOverDay: Ref<number | null>
  days: ComputedRef<CalendarDayView[]>
  getActionTitle(actionId: string): string
  getActionCategory(actionId: string): CalendarActionCategory
  getActionHours(actionId: string): string
  isPinned(day: CalendarDayView, actionIndex: number): boolean
  getWeekdayFullLabel(dayOffset: number): string
  dayHours(day: CalendarDayView): number
  formatHours(value: number): string
  getForecastStatValue(forecastDay: CalendarDayForecast, key: StatKey): number
  getForecastStatDelta(forecastDay: CalendarDayForecast, key: StatKey): number
  getForecastStatAlert(forecastDay: CalendarDayForecast, key: StatKey): 'underflow' | 'overflow' | ''
  removeAction(dayOffset: number, actionIndex: number): void
  setSleepHours(dayOffset: number, hours: number): void
  togglePin(dayOffset: number, actionIndex: number): void
  duplicateAction(dayOffset: number, actionIndex: number): void
  startDragging(dayOffset: number, actionIndex: number, event: DragEvent): void
  handleDragOver(dayOffset: number, event: DragEvent): void
  dropAction(targetDay: number): void
  endDragging(): void
  runPeriod(): Promise<void>
}
