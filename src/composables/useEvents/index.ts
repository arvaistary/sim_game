
export function useEvents() {
  const eventsStore = useEventsStore()
  const timeStore = useTimeStore()
  const statsStore = useStatsStore()
  const activityStore = useActivityStore()

  const currentEvent = ref<EventQueueItem | null>(null)

  const hasNextEvent = computed(() => {
    void timeStore.totalHours
    return eventsStore.hasEvent
  })

  function loadNextEvent(): EventQueueItem | null {
    eventsStore.showNextEvent()
    const next = eventsStore.currentEvent
    if (!next) {
      currentEvent.value = null
      return null
    }
    currentEvent.value = next as unknown as EventQueueItem
    return currentEvent.value
  }

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value?.choices) return false
    const choice = currentEvent.value.choices.find((c) => c.id === choiceId) as EventChoice | undefined
    if (!choice) return false

    if (choice.effects) {
      statsStore.applyStatChanges(choice.effects)
    }

    eventsStore.resolveCurrentEvent(choiceId, choice.text, choice.effects)

    activityStore.addEventEntry(
      currentEvent.value.title,
      choice.text,
      choice.outcome
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