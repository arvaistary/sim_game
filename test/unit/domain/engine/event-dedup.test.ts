import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { EventQueueSystem } from '@/domain/engine/systems/EventQueueSystem'
import { telemetryReset, telemetryGetCounters } from '@/domain/engine/utils/telemetry'
import type { EventIngressDTO } from '@/domain/engine/types'

describe('EventQueueSystem dedup', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let eventQueue: EventQueueSystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    eventQueue = new EventQueueSystem()
    eventQueue.init(world)
    telemetryReset()
  })

  describe('Legacy queuePendingEvent API', () => {
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
  })

  describe('New enqueueEvent API (EventIngress)', () => {
    test('enqueueEvent accepts valid DTO', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event_1',
        timeSnapshot: {
          totalHours: 100,
          day: 5,
          week: 1,
          month: 1,
          year: 1,
        },
        title: 'Test Event',
        description: 'Test Description',
        type: 'story',
      }
      const result = eventQueue.enqueueEvent(dto)
      expect(result.status).toBe('accepted')
      expect(result.instanceId).toBeTruthy()
      const queue = eventQueue.getEventQueue()
      expect(queue.count).toBe(1)
    })

    test('enqueueEvent rejects invalid DTO', () => {
      const dto = {
        source: 'time_micro',
        // missing templateId and timeSnapshot
        title: 'Test Event',
      } as EventIngressDTO
      const result = eventQueue.enqueueEvent(dto)
      if (result.status === 'rejected_invalid_payload') {
        expect(result.reason).toContain('Invalid event payload')
      } else {
        throw new Error('Expected rejected_invalid_payload status')
      }
    })

    test('enqueueEvent generates deterministic instanceId', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event_deterministic',
        timeSnapshot: {
          totalHours: 100,
          day: 5,
          week: 1,
          month: 1,
          year: 1,
        },
        title: 'Test Event',
        description: 'Test Description',
        type: 'story',
      }
      const result1 = eventQueue.enqueueEvent(dto)
      const result2 = eventQueue.enqueueEvent(dto)
      
      expect(result1.status).toBe('accepted')
      expect(result2.status).toBe('accepted')
      
      if (result1.status === 'accepted' && result2.status === 'accepted') {
        // instanceId должны быть разными (sequence увеличивается)
        expect(result1.instanceId).not.toBe(result2.instanceId)
        // Но оба должны начинаться с templateId_totalHours
        expect(result1.instanceId).toMatch(/^test_event_deterministic_100_\d+$/)
        expect(result2.instanceId).toMatch(/^test_event_deterministic_100_\d+$/)
      }
    })

    test('enqueueEvent rejects duplicate by instanceId', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event_dup',
        instanceId: 'custom_instance_id_123',
        timeSnapshot: {
          totalHours: 100,
          day: 5,
          week: 1,
          month: 1,
          year: 1,
        },
        title: 'Test Event',
        description: 'Test Description',
        type: 'story',
      }
      
      const result1 = eventQueue.enqueueEvent(dto)
      expect(result1.status).toBe('accepted')
      
      const result2 = eventQueue.enqueueEvent(dto)
      expect(result2.status).toBe('rejected_duplicate')
      if (result2.status === 'rejected_duplicate') {
        expect(result2.instanceId).toBe('custom_instance_id_123')
      }
      expect(telemetryGetCounters()['event_dedup_hit']).toBe(1)
    })

    test('enqueueEvent respects priority ordering', () => {
      const normalDto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'normal_event',
        priority: 'normal',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Normal Event',
        description: 'Normal',
        type: 'story',
      }
      
      const criticalDto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'critical_event',
        priority: 'critical',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Critical Event',
        description: 'Critical',
        type: 'story',
      }
      
      const lowDto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'low_event',
        priority: 'low',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Low Event',
        description: 'Low',
        type: 'story',
      }
      
      // Добавляем в порядке: normal, critical, low
      eventQueue.enqueueEvent(normalDto)
      eventQueue.enqueueEvent(criticalDto)
      eventQueue.enqueueEvent(lowDto)
      
      const queue = eventQueue.getEventQueue()
      expect(queue.count).toBe(3)
      
      // Порядок должен быть: critical, normal, low
      const events = queue.pendingEvents as Array<Record<string, unknown>>
      expect(events[0].templateId).toBe('critical_event')
      expect(events[1].templateId).toBe('normal_event')
      expect(events[2].templateId).toBe('low_event')
    })
  })

  describe('Bounded index dedup (O(1))', () => {
    test('bounded index prevents duplicate enqueue', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'bounded_test',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Bounded Test',
        description: 'Test',
        type: 'story',
      }
      
      const result1 = eventQueue.enqueueEvent(dto)
      expect(result1.status).toBe('accepted')
      
      // Попытка добавить то же событие снова
      const result2 = eventQueue.enqueueEvent(dto)
      expect(result2.status).toBe('rejected_duplicate')
      expect(telemetryGetCounters()['event_dedup_hit']).toBe(1)
    })

    test('bounded index works with legacy queuePendingEvent', () => {
      const event = {
        id: 'legacy_test',
        instanceId: 'legacy_test_123',
        title: 'Legacy Test',
        choices: [],
      }
      
      expect(eventQueue.queuePendingEvent(event)).toBe(true)
      
      // Попытка добавить то же событие через legacy API
      expect(eventQueue.queuePendingEvent(event)).toBe(false)
      expect(telemetryGetCounters()['event_dedup_hit']).toBe(1)
    })
  })

  describe('Common operations', () => {
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
})
