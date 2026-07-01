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

  const hasEvent: ComputedRef<boolean> = computed(() => currentEvent.value !== null)
  const queueLength: ComputedRef<number> = computed(() => eventQueue.value.length)
  const historyCount: ComputedRef<number> = computed(() => eventHistory.value.length)

  const nextEvent: ComputedRef<GameEvent | null> = computed(() => eventQueue.value[0] ?? null)

  function addToQueue(event: GameEvent): void {
    if (seenEventIds.value.has(event.instanceId)) return

    if (eventQueue.value.length >= MAX_QUEUE) return

    eventQueue.value.push(event)
  }

  function setCurrentEvent(event: GameEvent | null): void {
    currentEvent.value = event

    if (event) {
      seenEventIds.value.add(event.instanceId)
    }
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

    eventHistory.value.push({
      instanceId: currentEvent.value.instanceId,
      templateId: currentEvent.value.id,
      day: 0,
      choiceId,
      choiceText,
      effects,
    })

    if (eventHistory.value.length > MAX_HISTORY) {
      eventHistory.value = eventHistory.value.slice(-MAX_HISTORY)
    }
    currentEvent.value = null
    showNextEvent()
  }

  function applyChoice(choiceId: string): boolean {
    if (!currentEvent.value) return false

    const choice: EventChoice | undefined = currentEvent.value.choices?.find(
      (c: EventChoice) => c.id === choiceId
    )

    if (!choice) return false

    resolveCurrentEvent(choiceId, choice.text, choice.effects)
    return true
  }

  function skipEvent(): void {
    if (currentEvent.value) {
      eventHistory.value.push({
        instanceId: currentEvent.value.instanceId,
        templateId: currentEvent.value.id,
        day: 0,
      })
    }
    currentEvent.value = null
    showNextEvent()
  }

  function clearQueue(): void {
    eventQueue.value = []
  }

  function hasSeenEvent(eventId: string): boolean {
    return seenEventIds.value.has(eventId)
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
    }
  }

  function load(data: Record<string, unknown>): void {
    if (Array.isArray(data.eventQueue)) eventQueue.value = data.eventQueue as GameEvent[]

    if (Array.isArray(data.eventHistory)) eventHistory.value = data.eventHistory as EventHistoryEntry[]

    if (Array.isArray(data.seenEventIds)) seenEventIds.value = new Set(data.seenEventIds as string[])

    currentEvent.value = null
  }

  return {
    eventQueue,
    currentEvent,
    eventHistory,
    hasEvent,
    queueLength,
    historyCount,
    nextEvent,
    addToQueue,
    setCurrentEvent,
    showNextEvent,
    resolveCurrentEvent,
    applyChoice,
    skipEvent,
    clearQueue,
    hasSeenEvent,
    reset,
    save,
    load,
  }
})
