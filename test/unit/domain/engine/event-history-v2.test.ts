import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { EventHistorySystem } from '@/domain/engine/systems/EventHistorySystem'

describe('EventHistorySystem v2 (instanceId support)', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let eventHistory: EventHistorySystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    eventHistory = new EventHistorySystem()
    eventHistory.init(world)
  })

  describe('New recordEvent API with instanceId', () => {
    test('recordEvent with instanceId and templateId', () => {
      const result = eventHistory.recordEvent(
        'instance_123',
        'template_abc',
        'Test Event',
        'story',
        'time_micro',
        'choice_1',
        'Choice Text',
        { health: 10 },
      )
      
      expect(result).toBe(true)
      
      const history = eventHistory.getEventHistory()
      expect(history).toHaveLength(1)
      expect(history[0].instanceId).toBe('instance_123')
      expect(history[0].templateId).toBe('template_abc')
      expect(history[0].choiceId).toBe('choice_1')
      expect(history[0].choiceText).toBe('Choice Text')
      expect(history[0].effects).toEqual({ health: 10 })
    })

    test('recordEvent rejects duplicate by instanceId', () => {
      const result1 = eventHistory.recordEvent(
        'instance_dup',
        'template_xyz',
        'Duplicate Test',
        'story',
      )
      expect(result1).toBe(true)
      
      const result2 = eventHistory.recordEvent(
        'instance_dup',
        'template_xyz',
        'Duplicate Test',
        'story',
      )
      expect(result2).toBe(false) // Дубликат по instanceId
      
      const history = eventHistory.getEventHistory()
      expect(history).toHaveLength(1) // Только одна запись
    })

    test('recordEvent allows same templateId with different instanceId', () => {
      const result1 = eventHistory.recordEvent(
        'instance_1',
        'template_same',
        'Same Template 1',
        'story',
      )
      expect(result1).toBe(true)
      
      const result2 = eventHistory.recordEvent(
        'instance_2',
        'template_same',
        'Same Template 2',
        'story',
      )
      expect(result2).toBe(true)
      
      const history = eventHistory.getEventHistory()
      expect(history).toHaveLength(2)
      expect(history[0].instanceId).toBe('instance_1')
      expect(history[1].instanceId).toBe('instance_2')
      // Оба имеют одинаковый templateId
      expect(history[0].templateId).toBe('template_same')
      expect(history[1].templateId).toBe('template_same')
    })

    test('recordEvent stores time metadata', () => {
      const result = eventHistory.recordEvent(
        'instance_time',
        'template_time',
        'Time Test',
        'story',
      )
      expect(result).toBe(true)
      
      const history = eventHistory.getEventHistory()
      expect(history).toHaveLength(1)
      
      const entry = history[0]
      expect(entry.day).toBeGreaterThan(0)
      expect(entry.week).toBeGreaterThan(0)
      expect(entry.month).toBeGreaterThan(0)
      expect(entry.year).toBeGreaterThan(0)
      expect(entry.timestampHours).toBeGreaterThan(0)
      expect(entry.resolvedAt).toBeGreaterThan(0)
    })
  })

  describe('Legacy recordEventLegacy API', () => {
    test('recordEventLegacy generates instanceId from eventId', () => {
      const result = eventHistory.recordEventLegacy(
        'legacy_event',
        'Legacy Event',
        'story',
        'manual',
      )
      expect(result).toBe(true)
      
      const history = eventHistory.getEventHistory()
      expect(history).toHaveLength(1)
      expect(history[0].templateId).toBe('legacy_event')
      expect(history[0].instanceId).toMatch(/^legacy_event_\d+$/)
    })
  })

  describe('Query methods', () => {
    beforeEach(() => {
      // Добавляем несколько событий
      eventHistory.recordEvent('inst_1', 'tmpl_a', 'Event A1', 'story')
      eventHistory.recordEvent('inst_2', 'tmpl_b', 'Event B', 'story')
      eventHistory.recordEvent('inst_3', 'tmpl_a', 'Event A2', 'story')
    })

    test('getEventsByTemplateId returns events by templateId', () => {
      const eventsA = eventHistory.getEventsByTemplateId('tmpl_a')
      expect(eventsA).toHaveLength(2)
      expect(eventsA[0].instanceId).toBe('inst_3') // Самый новый первый
      expect(eventsA[1].instanceId).toBe('inst_1')
      
      const eventsB = eventHistory.getEventsByTemplateId('tmpl_b')
      expect(eventsB).toHaveLength(1)
      expect(eventsB[0].instanceId).toBe('inst_2')
    })

    test('hasInstanceOccurred checks by instanceId', () => {
      expect(eventHistory.hasInstanceOccurred('inst_1')).toBe(true)
      expect(eventHistory.hasInstanceOccurred('inst_2')).toBe(true)
      expect(eventHistory.hasInstanceOccurred('inst_nonexistent')).toBe(false)
    })

    test('hasEventOccurred checks by templateId (legacy)', () => {
      expect(eventHistory.hasEventOccurred('tmpl_a')).toBe(true)
      expect(eventHistory.hasEventOccurred('tmpl_b')).toBe(true)
      expect(eventHistory.hasEventOccurred('tmpl_nonexistent')).toBe(false)
    })

    test('getEventStats returns correct stats', () => {
      const stats = eventHistory.getEventStats()
      expect(stats.total).toBe(3)
      expect(stats.lastInstanceId).toBe('inst_3')
      expect(stats.lastTemplateId).toBe('tmpl_a')
    })
  })

  describe('Bounded index integration', () => {
    test('seenInstanceIds is initialized', () => {
      const playerId = 'player'
      const eventHistoryComponent = world.getComponent(playerId, 'eventHistory') as Record<string, unknown>
      
      expect(eventHistoryComponent).toBeDefined()
      expect(eventHistoryComponent.seenInstanceIds).toBeInstanceOf(Set)
    })

    test('recordEvent adds to seenInstanceIds', () => {
      eventHistory.recordEvent('inst_seen', 'tmpl_seen', 'Seen Test', 'story')
      
      const playerId = 'player'
      const eventHistoryComponent = world.getComponent(playerId, 'eventHistory') as Record<string, unknown>
      const seenIndex = eventHistoryComponent.seenInstanceIds as Set<string>
      
      expect(seenIndex.has('inst_seen')).toBe(true)
    })
  })
})
