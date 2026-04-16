import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import { telemetryReset, telemetryGetCounters } from '@/domain/engine/utils/telemetry'

describe('EventQueueSystem dedup', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let eventQueue: EventQueueSystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    eventQueue = new EventQueueSystem()
    eventQueue.init(world)
    telemetryReset()
  })

  test('queuePendingEvent adds event to queue', () => {
    const result = eventQueue.queuePendingEvent({
      id: 'test_event_1',
      title: 'Test Event',
      choices: [],
    })
    expect(result).toBe(true)
    const queue = eventQueue.getEventQueue()
    expect(queue.count).toBe(1)
  })

  test('queuePendingEvent rejects duplicate by instanceId', () => {
    const event = {
      id: 'test_event_2',
      instanceId: 'test_event_2_1000',
      title: 'Test Event 2',
      choices: [],
    }
    // Первое добавление
    expect(eventQueue.queuePendingEvent(event)).toBe(true)
    // Дубликат
    expect(eventQueue.queuePendingEvent(event)).toBe(false)
    // Проверяем telemetry
    expect(telemetryGetCounters()['event_dedup_hit']).toBe(1)
    const queue = eventQueue.getEventQueue()
    expect(queue.count).toBe(1)
  })

  test('queuePendingEvent generates instanceId if missing', () => {
    const result = eventQueue.queuePendingEvent({
      id: 'test_event_3',
      title: 'Test Event 3',
      choices: [],
    })
    expect(result).toBe(true)
    const queue = eventQueue.getEventQueue()
    const queued = queue.pendingEvents[0] as Record<string, unknown>
    expect(queued.instanceId).toBeTruthy()
    expect((queued.instanceId as string).startsWith('test_event_3')).toBe(true)
  })

  test('consumePendingEvent removes and returns first event', () => {
    eventQueue.queuePendingEvent({ id: 'ev1', title: 'Event 1', choices: [] })
    eventQueue.queuePendingEvent({ id: 'ev2', title: 'Event 2', choices: [] })
    expect(eventQueue.getEventCount()).toBe(2)
    
    const consumed = eventQueue.consumePendingEvent()
    expect(consumed).toBeTruthy()
    expect((consumed as Record<string, unknown>).id).toBe('ev1')
    expect(eventQueue.getEventCount()).toBe(1)
  })

  test('clearEventQueue removes all events', () => {
    eventQueue.queuePendingEvent({ id: 'ev1', title: 'Event 1', choices: [] })
    eventQueue.queuePendingEvent({ id: 'ev2', title: 'Event 2', choices: [] })
    eventQueue.clearEventQueue()
    expect(eventQueue.getEventCount()).toBe(0)
    expect(eventQueue.hasPendingEvents()).toBe(false)
  })

  test('dedup invariant: re-enqueue same instanceId does not increase queue and increments event_dedup_hit', () => {
    telemetryReset()
    const event = {
      id: 'dedup_test',
      instanceId: 'dedup_test_unique_001',
      title: 'Dedup Test',
      choices: [],
    }

    // Первое добавление
    expect(eventQueue.queuePendingEvent(event)).toBe(true)
    expect(eventQueue.getEventCount()).toBe(1)
    expect(telemetryGetCounters()['event_dedup_hit']).toBeUndefined()

    // Повторное добавление того же instanceId
    expect(eventQueue.queuePendingEvent(event)).toBe(false)
    expect(eventQueue.getEventCount()).toBe(1) // очередь не выросла
    expect(telemetryGetCounters()['event_dedup_hit']).toBe(1) // telemetry зафиксировал

    // Ещё раз
    expect(eventQueue.queuePendingEvent(event)).toBe(false)
    expect(eventQueue.getEventCount()).toBe(1) // всё ещё 1
    expect(telemetryGetCounters()['event_dedup_hit']).toBe(2) // второй hit
  })
})
