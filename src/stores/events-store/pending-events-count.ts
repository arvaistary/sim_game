import type { EventsStore } from './pending-events-count.types'

/**
 * Количество событий в UI-очереди (текущее + pending).
 * @description [Store] - shared helper для useEvents и useDayPlanner.
 * @return { number }
 */
export function getPendingEventsCount(eventsStore: EventsStore): number {
  const currentCount: number = eventsStore.currentEvent ? 1 : 0

  return currentCount + eventsStore.queueLength
}
