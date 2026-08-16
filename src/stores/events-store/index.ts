import type { Ref, ComputedRef } from 'vue'
import type { EventChoice, GameEvent, EventHistoryEntry } from './events-store.types'

export type { EventChoice, GameEvent, EventHistoryEntry } from './events-store.types'

const MAX_QUEUE: number = 10
const MAX_HISTORY: number = 50

export const useEventsStore = defineStore('events', () => {
  const eventQueue: Ref<GameEvent[]> = ref<GameEvent[]>([])
  const currentEvent: Ref<GameEvent | null> = ref<GameEvent | null>(null)
  const eventHistory: Ref<EventHistoryEntry[]> = ref<EventHistoryEntry[]>([])
  const seenEventIds: Ref<Set<string>> = ref<Set<string>>(new Set())

  const queueLength: ComputedRef<number> = computed(() => eventQueue.value.length)
  /** Есть текущее или ожидающие в очереди — для индикатора FR-008. */
  const hasPendingEvents: ComputedRef<boolean> = computed(
    () => currentEvent.value !== null || eventQueue.value.length > 0,
  )

  const nextEvent: ComputedRef<GameEvent | null> = computed(() => eventQueue.value[0] ?? null)

  function addToQueue(event: GameEvent): void {
    if (seenEventIds.value.has(event.instanceId)) return

    if (eventQueue.value.length >= MAX_QUEUE) return

    eventQueue.value.push({
      ...event,
      priority: event.priority ?? 'normal',
    })
  }

  function showNextEvent(): void {
    if (eventQueue.value.length > 0) {
      currentEvent.value = eventQueue.value.shift() ?? null
    } else {
      currentEvent.value = null
    }
  }

  function resolveCurrentEvent(choiceId: string, choiceText: string, effects?: Record<string, number>): void {
    if (!currentEvent.value) return

    const timeStore = useTimeStore()

    const instanceId: string = currentEvent.value.instanceId

    eventHistory.value.push({
      instanceId,
      templateId: currentEvent.value.id,
      day: timeStore.gameDays,
      choiceId,
      choiceText,
      effects,
    })

    seenEventIds.value.add(instanceId)

    if (eventHistory.value.length > MAX_HISTORY) {
      eventHistory.value = eventHistory.value.slice(-MAX_HISTORY)
    }

    // Не вызываем showNextEvent — UI (EventModal) грузит следующее через loadNextEvent.
    currentEvent.value = null
  }

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value) return false

    const choice: EventChoice | undefined = currentEvent.value.choices?.find(
      (item: EventChoice) => item.id === choiceId,
    )

    if (!choice) return false

    resolveCurrentEvent(choiceId, choice.text, choice.effects)
    return true
  }

  function skipEvent(): void {
    if (currentEvent.value) {
      const timeStore = useTimeStore()

      eventHistory.value.push({
        instanceId: currentEvent.value.instanceId,
        templateId: currentEvent.value.id,
        day: timeStore.gameDays,
      })
    }
    currentEvent.value = null
    showNextEvent()
  }

  function clearQueue(): void {
    eventQueue.value = []
  }

  function reset(): void {
    eventQueue.value = []
    currentEvent.value = null
    eventHistory.value = []
    seenEventIds.value = new Set()
  }

  function save(): Record<string, unknown> {
    return {
      eventQueue: eventQueue.value,
      eventHistory: eventHistory.value,
      seenEventIds: [...seenEventIds.value],
      currentEvent: currentEvent.value,
    }
  }

  function load(data: Record<string, unknown>): void {
    if (Array.isArray(data.eventQueue)) {
      eventQueue.value = (data.eventQueue as GameEvent[]).map((event: GameEvent) => ({
        ...event,
        priority: event.priority ?? 'normal',
      }))
    }

    if (Array.isArray(data.eventHistory)) eventHistory.value = data.eventHistory as EventHistoryEntry[]

    if (Array.isArray(data.seenEventIds)) seenEventIds.value = new Set(data.seenEventIds as string[])

    const loadedCurrent: GameEvent | null = (data.currentEvent as GameEvent | null | undefined) ?? null

    currentEvent.value = loadedCurrent
      ? { ...loadedCurrent, priority: loadedCurrent.priority ?? 'normal' }
      : null
  }

  return {
    eventQueue,
    currentEvent,
    eventHistory,
    hasPendingEvents,
    queueLength,
    nextEvent,
    addToQueue,
    showNextEvent,
    applyChoice,
    skipEvent,
    clearQueue,
    reset,
    save,
    load,
  }
})
