import { computed, ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { CommandOutcome } from '@/application/game/index.types'
import { useGameStore } from '@/stores/game.store'
import { useEventsStore } from '@/stores/events-store'
import { getPendingEventsCount } from '@/stores/events-store/pending-events-count'
import type { GameEvent } from '@/stores/events-store'
import { useTimeStore } from '@/stores/time-store'

/**
 * Composable для управления игровыми событиями.
 * @description [Composable] - загружает, отображает и применяет выборы в событиях с обновлением статов.
 * @return { object } текущее событие, индикаторы очереди, методы загрузки и применения выбора
 */
export function useEvents() {
  const eventsStore = useEventsStore()
  const timeStore = useTimeStore()
  const gameStore = useGameStore()

  const currentEvent: Ref<GameEvent | null> = ref<GameEvent | null>(null)

  /** Есть ещё события в очереди после текущего (для EventResult «далее»). */
  const hasNextEvent: ComputedRef<boolean> = computed(() => {
    void timeStore.totalHours

    return eventsStore.queueLength > 0
  })

  /** Есть текущее или ожидающие — ненавязчивый бейдж FR-008. */
  const hasPendingEvents: ComputedRef<boolean> = computed(() => {
    void timeStore.totalHours

    return eventsStore.hasPendingEvents
  })

  const pendingEventsCount: ComputedRef<number> = computed(() => {
    void timeStore.totalHours

    return getPendingEventsCount(eventsStore)
  })

  function loadNextEvent(): GameEvent | null {
    eventsStore.showNextEvent()
    const next: GameEvent | null = eventsStore.currentEvent

    if (!next) {
      currentEvent.value = null
      return null
    }
    currentEvent.value = next
    return currentEvent.value
  }

  async function applyChoice(choiceId: string): Promise<boolean> {
    if (!currentEvent.value?.choices) return false

    const result: CommandOutcome = await gameStore.resolveEventDecisionAsync(currentEvent.value.id, choiceId)

    if (!result.success) return false

    currentEvent.value = null
    return true
  }

  return {
    currentEvent,
    hasNextEvent,
    hasPendingEvents,
    pendingEventsCount,
    loadNextEvent,
    applyChoice,
  }
}
