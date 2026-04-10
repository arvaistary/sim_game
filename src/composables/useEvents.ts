import { ref, computed } from 'vue'
import { useGameStore } from '@/stores/game.store'
import type { EventQueueItem, EventChoice } from '@/domain/ecs/types'

export function useEvents() {
  const store = useGameStore()

  const currentEvent = ref<EventQueueItem | null>(null)

  const hasNextEvent = computed(() => Boolean(store.getNextEvent()))

  function loadNextEvent(): EventQueueItem | null {
    const nextEvent = store.getNextEvent() as unknown as EventQueueItem | null
    if (!nextEvent) {
      currentEvent.value = null
      return null
    }
    currentEvent.value = nextEvent
    return currentEvent.value
  }

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value?.choices) return false
    const choice = currentEvent.value.choices.find((c) => c.id === choiceId) as EventChoice | undefined
    if (!choice) return false

    const result = store.applyEventChoice(currentEvent.value.id, choiceId)
    if (!result || result.startsWith('Событие не найдено') || result.startsWith('У события нет')) return false
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

