import { describe, expect, test, beforeEach } from 'vitest'
import { EventIngress, InstanceIdGenerator } from '@/domain/engine/systems/EventQueueSystem/EventIngress'
import type { EventIngressDTO } from '@/domain/engine/types'

describe('EventIngress API', () => {
  let ingress: EventIngress

  beforeEach(() => {
    ingress = new EventIngress()
  })

  describe('InstanceIdGenerator', () => {
    let generator: InstanceIdGenerator

    beforeEach(() => {
      generator = new InstanceIdGenerator()
    })

    test('generates deterministic instanceId', () => {
      const id1 = generator.generate('test_event', 100)
      const id2 = generator.generate('test_event', 100)
      
      expect(id1).toBe('test_event_100_1')
      expect(id2).toBe('test_event_100_2')
    })

    test('different templateIds produce different instanceIds', () => {
      const id1 = generator.generate('event_a', 100)
      const id2 = generator.generate('event_b', 100)
      
      expect(id1).toBe('event_a_100_1')
      expect(id2).toBe('event_b_100_1')
    })

    test('different totalHours produce different instanceIds', () => {
      const id1 = generator.generate('test_event', 100)
      const id2 = generator.generate('test_event', 200)
      
      expect(id1).toBe('test_event_100_1')
      expect(id2).toBe('test_event_200_1')
    })

    test('reset clears sequence counters', () => {
      generator.generate('test_event', 100)
      generator.reset()
      const id = generator.generate('test_event', 100)
      
      expect(id).toBe('test_event_100_1')
    })
  })

  describe('normalize', () => {
    test('normalizes valid DTO', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
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
        choices: [
          { id: 'choice_1', text: 'Choice 1', effects: { health: 10 } },
        ],
      }
      
      const normalized = ingress.normalize(dto)
      expect(normalized).not.toBeNull()
      expect(normalized?.priority).toBe('normal')
      expect(normalized?.choices).toHaveLength(1)
      expect(normalized?.choices?.[0].id).toBe('choice_1')
    })

    test('adds default priority if missing', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Test Event',
        description: 'Test',
        type: 'story',
      }
      
      const normalized = ingress.normalize(dto)
      expect(normalized?.priority).toBe('normal')
    })

    test('normalizes choices with missing ids', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Test Event',
        description: 'Test',
        type: 'story',
        choices: [
          { text: 'Choice 1', effects: { health: 10 } } as any,
          { text: 'Choice 2', effects: { energy: 5 } } as any,
        ],
      }
      
      const normalized = ingress.normalize(dto)
      expect(normalized?.choices).toHaveLength(2)
      expect(normalized?.choices?.[0].id).toBe('choice_0')
      expect(normalized?.choices?.[1].id).toBe('choice_1')
    })

    test('returns null for invalid DTO (missing templateId)', () => {
      const dto = {
        source: 'time_micro',
        // missing templateId
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Test Event',
      } as EventIngressDTO
      
      const normalized = ingress.normalize(dto)
      expect(normalized).toBeNull()
    })

    test('returns null for invalid DTO (missing timeSnapshot)', () => {
      const dto = {
        source: 'time_micro',
        templateId: 'test_event',
        // missing timeSnapshot
        title: 'Test Event',
      } as EventIngressDTO
      
      const normalized = ingress.normalize(dto)
      expect(normalized).toBeNull()
    })

    test('returns null for invalid DTO (missing title)', () => {
      const dto = {
        source: 'time_micro',
        templateId: 'test_event',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        // missing title
      } as EventIngressDTO
      
      const normalized = ingress.normalize(dto)
      expect(normalized).toBeNull()
    })
  })

  describe('resolveInstanceId', () => {
    test('returns provided instanceId', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
        instanceId: 'custom_id_123',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Test Event',
        description: 'Test',
        type: 'story',
      }
      
      const instanceId = ingress.resolveInstanceId(dto)
      expect(instanceId).toBe('custom_id_123')
    })

    test('generates instanceId if not provided', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
        timeSnapshot: { totalHours: 100, day: 5, week: 1, month: 1, year: 1 },
        title: 'Test Event',
        description: 'Test',
        type: 'story',
      }
      
      const instanceId = ingress.resolveInstanceId(dto)
      expect(instanceId).toMatch(/^test_event_100_\d+$/)
    })
  })

  describe('toQueueItem', () => {
    test('converts DTO to EventQueueItem', () => {
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'test_event',
        priority: 'high',
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
        choices: [
          { id: 'choice_1', text: 'Choice 1', effects: { health: 10 } },
        ],
        meta: { customField: 'value' },
      }
      
      const queueItem = ingress.toQueueItem(dto)
      
      expect(queueItem.id).toBe('test_event')
      expect(queueItem.instanceId).toBeTruthy()
      expect(queueItem.type).toBe('story')
      expect(queueItem.title).toBe('Test Event')
      expect(queueItem.description).toBe('Test Description')
      expect(queueItem.day).toBe(5)
      expect(queueItem.week).toBe(1)
      expect(queueItem.month).toBe(1)
      expect(queueItem.year).toBe(1)
      expect(queueItem._priority).toBe('high')
      expect(queueItem._source).toBe('time_micro')
      expect(queueItem.data).toEqual({ customField: 'value' })
    })
  })

  describe('comparePriority', () => {
    test('critical has higher priority than high', () => {
      const critical = { _priority: 'critical' }
      const high = { _priority: 'high' }
      
      expect(ingress.comparePriority(critical, high)).toBeLessThan(0)
      expect(ingress.comparePriority(high, critical)).toBeGreaterThan(0)
    })

    test('high has higher priority than normal', () => {
      const high = { _priority: 'high' }
      const normal = { _priority: 'normal' }
      
      expect(ingress.comparePriority(high, normal)).toBeLessThan(0)
      expect(ingress.comparePriority(normal, high)).toBeGreaterThan(0)
    })

    test('normal has higher priority than low', () => {
      const normal = { _priority: 'normal' }
      const low = { _priority: 'low' }
      
      expect(ingress.comparePriority(normal, low)).toBeLessThan(0)
      expect(ingress.comparePriority(low, normal)).toBeGreaterThan(0)
    })

    test('same priority returns 0', () => {
      const a = { _priority: 'normal' }
      const b = { _priority: 'normal' }
      
      expect(ingress.comparePriority(a, b)).toBe(0)
    })

    test('missing priority defaults to normal', () => {
      const a = { _priority: 'high' }
      const b = {} // no priority
      
      expect(ingress.comparePriority(a, b)).toBeLessThan(0)
      expect(ingress.comparePriority(b, a)).toBeGreaterThan(0)
    })
  })

  describe('Result helpers', () => {
    test('accepted creates accepted result', () => {
      const result = ingress.accepted('instance_123')
      expect(result).toEqual({
        status: 'accepted',
        instanceId: 'instance_123',
      })
    })

    test('rejectedDuplicate creates rejected_duplicate result', () => {
      const result = ingress.rejectedDuplicate('instance_123', 'Already seen')
      expect(result).toEqual({
        status: 'rejected_duplicate',
        instanceId: 'instance_123',
        reason: 'Already seen',
      })
    })

    test('rejectedInvalid creates rejected_invalid_payload result', () => {
      const result = ingress.rejectedInvalid('Missing required fields')
      expect(result).toEqual({
        status: 'rejected_invalid_payload',
        reason: 'Missing required fields',
      })
    })
  })
})
