
import type { ComputedRef, Ref } from 'vue'
import type { GameEvent } from '@/stores/events-store'
import { appGameCommands } from '@/application/game/commands'

/**
 * Composable для управления игровыми событиями.
 * @description [Composable] - загружает, отображает и применяет выборы в событиях с обновлением статов.
 * @return { object } текущее событие, наличие следующего, методы загрузки и применения выбора
 */
export function useEvents() {
  const eventsStore = useEventsStore()

  const timeStore = useTimeStore()

  const currentEvent: Ref<GameEvent | null> = ref<GameEvent | null>(null)

  const hasNextEvent: ComputedRef<boolean> = computed(() => {
    void timeStore.totalHours
    return eventsStore.hasEvent
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

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value?.choices) return false

    const result = appGameCommands.resolveEventDecision(currentEvent.value.id, choiceId)
    if (!result.success) return false

    currentEvent.value = null
    return true
  }

  return {
    currentEvent,
    hasNextEvent,
    loadNextEvent,
    applyChoice,
  }
}