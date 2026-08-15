import type { Ref } from 'vue'
import type { CalendarDayPlan, CalendarPlan } from '@/domain/game-world/calendar'
import type { DayPlanInput } from '@/domain/game-world/commands/commands.types'

/** Состояние многодневного черновика календаря. */
export interface CalendarPlanStoreState {
  plan: Ref<CalendarPlan>
}

export type { CalendarDayPlan, CalendarPlan, DayPlanInput }
