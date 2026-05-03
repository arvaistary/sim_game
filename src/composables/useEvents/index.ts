import type { GameEvent, EventChoice } from '@stores/events-store'
import { processEventChoice, skipEvent } from '@application/game'

export interface UseEventsResult {
  currentEvent: Ref<GameEvent | null>
  hasNextEvent: ComputedRef<boolean>
  loadNextEvent: () => GameEvent | null
  applyChoice: (choiceId: string) => { success: boolean; message: string; effects?: Record<string, number> }
  skipEvent: () => { success: boolean; skippedEventId?: string }
}

export const useEvents = (): UseEventsResult => {
  const eventsStore = useEventsStore()
  const timeStore = useTimeStore()

  const currentEvent = ref<GameEvent | null>(null)

  const hasNextEvent = computed<boolean>(() => {
    void timeStore.totalHours

    return eventsStore.hasEvent
  })

  function loadNextEvent(): GameEvent | null {
    if (!eventsStore.currentEvent) {
      eventsStore.showNextEvent()
    }

    const next: GameEvent | null = eventsStore.currentEvent
    currentEvent.value = next

    return currentEvent.value
  }

  function applyChoice(choiceId: string): { success: boolean; message: string; effects?: Record<string, number> } {
    if (!currentEvent.value?.choices) {
      return { success: false, message: 'Нет активного события' }
    }

    const choice: EventChoice | undefined = currentEvent.value.choices.find(
      (c: EventChoice) => c.id === choiceId,
    )

    if (!choice) {
      return { success: false, message: 'Вариант ответа не найден' }
    }

    const result = processEventChoice(
      {
        currentEvent: currentEvent.value,
        findChoiceById: (id: string) => currentEvent.value?.choices?.find(c => c.id === id),
      },
      choiceId,
    )

    if (result.success) {
      eventsStore.resolveCurrentEvent(choiceId, choice.text, choice.effects)
      currentEvent.value = null
    }

    return {
      success: result.success,
      message: result.message,
      effects: result.effects,
    }
  }

  function handleSkipEvent(): { success: boolean; skippedEventId?: string } {
    const result = skipEvent(currentEvent.value)

    if (result.success) {
      eventsStore.skipEvent()
      currentEvent.value = null
    }

    return result
  }

  return {
    currentEvent,
    hasNextEvent,
    loadNextEvent,
    applyChoice,
    skipEvent: handleSkipEvent,
  }
}