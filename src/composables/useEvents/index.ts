import type { GameEvent, EventChoice } from '@stores/events-store'

/**
 * @description [Composables] - Предоставляет функции для работы с событиями: загрузка следующего события, применение выбора игрока.
 * @return { object } Объект с currentEvent, hasNextEvent, loadNextEvent, applyChoice.
 */
export const useEvents = () => {
  const eventsStore = useEventsStore()
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const activityStore = useActivityStore()

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

    if (!next) {
      currentEvent.value = null

      return null
    }
    currentEvent.value = next

    return currentEvent.value
  }

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value?.choices) return false

    const choice: EventChoice | undefined = currentEvent.value.choices.find(
      (c: EventChoice) => c.id === choiceId,
    )

    if (!choice) return false

    if (choice.effects) {
      statsStore.applyStatChangesRaw(choice.effects)
    }

    eventsStore.resolveCurrentEvent(choiceId, choice.text, choice.effects)

    activityStore.addEventEntry(
      currentEvent.value.title,
      choice.text,
      choice.outcome,
    )

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
