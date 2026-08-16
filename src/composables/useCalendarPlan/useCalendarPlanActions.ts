import { useCalendarPlanStore } from '@/stores/calendar-plan-store'
import { useGameStore } from '@/stores/game.store'
import { validateCalendarAction } from '@/domain/game-world/calendar'
import type { CalendarPlan, CalendarValidationResult } from '@/domain/game-world/calendar'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { UseCalendarPlanActions } from './useCalendarPlan.types'

/**
 * @description [Composable] - добавляет действие в день календаря после доменной валидации.
 * @return { UseCalendarPlanActions } действие добавления календарного действия
 */
export function useCalendarPlanActions(): UseCalendarPlanActions {
  const calendarStore = useCalendarPlanStore()

  const gameStore = useGameStore()

  function addAction(dayOffset: number, actionId: string): string | null {
    const currentPlan: CalendarPlan = {
      days: calendarStore.plan.days.map((day) => ({
        ...day,
        actionIds: [...day.actionIds],
      })),
    }
    const world: GameWorld = GameWorld.fromJSON(gameStore.getWorldState())
    const validation: CalendarValidationResult = validateCalendarAction(world, currentPlan, dayOffset, actionId)

    if (!validation.success) return validation.message

    calendarStore.addAction(dayOffset, actionId)
    return null
  }

  return { addAction }
}
