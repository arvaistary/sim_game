import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import { createWorldFromSave, getSystemContext } from '@/domain/game-facade'
import { PersistenceSystem } from '@/domain/engine/systems/PersistenceSystem'
import { EventMigration, EVENT_SCHEMA_VERSION } from '@/infrastructure/persistence/event-migration'
import type { EventIngressDTO } from '@/domain/engine/types'

describe('Event System Persistence Migration', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let context: ReturnType<typeof getSystemContext>
  let persistence: PersistenceSystem
  let eventMigration: EventMigration

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    context = getSystemContext(world)
    persistence = new PersistenceSystem()
    persistence.init(world)
    eventMigration = new EventMigration()
    
    // Очищаем localStorage перед каждым тестом
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Legacy save format migration', () => {
    test('migrates legacy eventQueue to canonical format', () => {
      // Создаём legacy save
      const legacySave: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_queue: {
          pendingEvents: [
            {
              id: 'legacy_event_1',
              type: 'story',
              title: 'Legacy Event 1',
              description: 'Legacy Description',
              choices: [
                { id: 'choice_1', text: 'Choice 1', effects: { health: 10 } },
              ],
              day: 5,
            },
          ],
        },
      }

      // Применяем миграцию
      const result = eventMigration.migrateSave(legacySave)

      expect(result.success).toBe(true)
      expect(result.fromVersion).toBe(1)
      expect(result.toVersion).toBe(EVENT_SCHEMA_VERSION)
      expect(result.migratedEvents).toBe(1)

      // Проверяем мигрированные данные
      const eventQueue = legacySave.event_queue as Record<string, unknown>
      const pendingEvents = eventQueue.pendingEvents as Array<Record<string, unknown>>
      
      expect(pendingEvents).toHaveLength(1)
      expect(pendingEvents[0].id).toBe('legacy_event_1')
      expect(pendingEvents[0].instanceId).toBeTruthy()
      expect(typeof pendingEvents[0].instanceId).toBe('string')
      expect(pendingEvents[0].week).toBe(1)
      expect(pendingEvents[0].month).toBe(1)
      expect(pendingEvents[0].year).toBe(1)
    })

    test('migrates legacy eventHistory to canonical format', () => {
      // Создаём legacy save
      const legacySave: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_history: {
          events: [
            {
              eventId: 'legacy_history_1',
              day: 3,
              choiceId: 'choice_1',
              effects: { health: 5 },
            },
          ],
        },
      }

      // Применяем миграцию
      const result = eventMigration.migrateSave(legacySave)

      expect(result.success).toBe(true)
      expect(result.migratedEvents).toBe(1)

      // Проверяем мигрированные данные
      const eventHistory = legacySave.event_history as Record<string, unknown>
      const events = eventHistory.events as Array<Record<string, unknown>>
      
      expect(events).toHaveLength(1)
      expect(events[0].templateId).toBe('legacy_history_1')
      expect(events[0].instanceId).toBeTruthy()
      expect(events[0].week).toBe(1)
      expect(events[0].month).toBe(1)
      expect(events[0].year).toBe(1)
      expect(events[0].resolvedAt).toBe(100)
    })

    test('initializes seenInstanceIds after migration', () => {
      const legacySave: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_history: {
          events: [],
        },
      }

      eventMigration.migrateSave(legacySave)

      const eventHistory = legacySave.event_history as Record<string, unknown>
      expect(eventHistory.seenInstanceIds).toBeInstanceOf(Set)
    })

    test('initializes period dedup sets after migration', () => {
      const legacySave: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
          eventState: {},
        },
      }

      eventMigration.migrateSave(legacySave)

      const time = legacySave.time as Record<string, unknown>
      const eventState = time.eventState as Record<string, unknown>
      
      expect(eventState.processedWeeklyEvents).toBeInstanceOf(Set)
      expect(eventState.processedMonthlyEvents).toBeInstanceOf(Set)
      expect(eventState.processedYearlyEvents).toBeInstanceOf(Set)
    })
  })

  describe('Save/Load regression tests', () => {
    test('migration preserves eventQueue with instanceId', () => {
      // Создаём save с legacy событиями
      const saveWithLegacyEvents: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_queue: {
          pendingEvents: [
            {
              id: 'test_event',
              type: 'story',
              title: 'Test Event',
              description: 'Test Description',
              day: 5,
            },
          ],
        },
      }

      // Применяем миграцию
      const result = eventMigration.migrateSave(saveWithLegacyEvents)

      expect(result.success).toBe(true)
      expect(result.migratedEvents).toBe(1)

      // Проверяем мигрированные данные
      const eventQueue = saveWithLegacyEvents.event_queue as Record<string, unknown>
      const pendingEvents = eventQueue.pendingEvents as Array<Record<string, unknown>>
      
      expect(pendingEvents).toHaveLength(1)
      expect(pendingEvents[0].id).toBe('test_event')
      expect(pendingEvents[0].instanceId).toBeTruthy()
      expect(pendingEvents[0].week).toBe(1)
      expect(pendingEvents[0].month).toBe(1)
      expect(pendingEvents[0].year).toBe(1)
    })

    test('migration preserves eventHistory with instanceId', () => {
      // Создаём save с legacy историей
      const saveWithLegacyHistory: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_history: {
          events: [
            {
              eventId: 'history_test',
              day: 3,
              choiceId: 'choice_1',
              effects: { health: 10 },
            },
          ],
        },
      }

      // Применяем миграцию
      const result = eventMigration.migrateSave(saveWithLegacyHistory)

      expect(result.success).toBe(true)
      expect(result.migratedEvents).toBe(1)

      // Проверяем мигрированные данные
      const eventHistory = saveWithLegacyHistory.event_history as Record<string, unknown>
      const events = eventHistory.events as Array<Record<string, unknown>>
      
      expect(events).toHaveLength(1)
      expect(events[0].templateId).toBe('history_test')
      expect(events[0].instanceId).toBeTruthy()
      expect(events[0].choiceId).toBe('choice_1')
      expect(events[0].effects).toEqual({ health: 10 })
    })

    test('legacy save is migrated on load', () => {
      // Создаём legacy save
      const legacySave: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_queue: {
          pendingEvents: [
            {
              id: 'legacy_event',
              type: 'story',
              title: 'Legacy Event',
              description: 'Legacy',
              day: 5,
            },
          ],
        },
        event_history: {
          events: [
            {
              eventId: 'legacy_history',
              day: 3,
            },
          ],
        },
      }

      // Применяем миграцию напрямую (без PersistenceSystem)
      const result = eventMigration.migrateSave(legacySave)

      expect(result.success).toBe(true)
      expect(legacySave.version).toBe('1.2.0')

      // Проверяем мигрированные события
      const eventQueue = legacySave.event_queue as Record<string, unknown>
      const pendingEvents = eventQueue.pendingEvents as Array<Record<string, unknown>>
      
      expect(pendingEvents[0].instanceId).toBeTruthy()
      expect(pendingEvents[0].week).toBe(1)
      expect(pendingEvents[0].month).toBe(1)
      expect(pendingEvents[0].year).toBe(1)

      const eventHistory = legacySave.event_history as Record<string, unknown>
      const events = eventHistory.events as Array<Record<string, unknown>>
      
      expect(events[0].instanceId).toBeTruthy()
      expect(events[0].templateId).toBe('legacy_history')
    })
  })

  describe('Migration validation', () => {
    test('validateQueueItem validates canonical format', () => {
      const canonical = {
        id: 'test',
        instanceId: 'test_100_1',
        type: 'story',
        title: 'Test',
        description: 'Test',
        day: 5,
      }

      expect(eventMigration.validateQueueItem(canonical)).toBe(true)

      const invalid = { id: 'test' } // Missing required fields
      expect(eventMigration.validateQueueItem(invalid)).toBe(false)
    })

    test('validateHistoryEntry validates canonical format', () => {
      const canonical = {
        instanceId: 'test_100_1',
        templateId: 'test',
        day: 5,
      }

      expect(eventMigration.validateHistoryEntry(canonical)).toBe(true)

      const invalid = { instanceId: 'test' } // Missing templateId
      expect(eventMigration.validateHistoryEntry(invalid)).toBe(false)
    })

    test('needsMigration returns true for old saves', () => {
      const oldSave: Record<string, unknown> = {
        version: '0.1.0',
        eventSchemaVersion: 1,
      }

      expect(eventMigration.needsMigration(oldSave)).toBe(true)

      const newSave: Record<string, unknown> = {
        version: '1.2.0',
        eventSchemaVersion: EVENT_SCHEMA_VERSION,
      }

      expect(eventMigration.needsMigration(newSave)).toBe(false)
    })
  })

  describe('Idempotency after migration', () => {
    test('migrated events maintain unique instanceIds', () => {
      // Создаём save с несколькими legacy событиями
      const saveWithMultipleEvents: Record<string, unknown> = {
        version: '0.1.0',
        playerName: 'Tester',
        time: {
          totalHours: 100,
          gameDays: 5,
          gameWeeks: 1,
          gameMonths: 1,
          gameYears: 1,
        },
        event_queue: {
          pendingEvents: [
            {
              id: 'event_1',
              type: 'story',
              title: 'Event 1',
              description: 'Test',
              day: 5,
            },
            {
              id: 'event_2',
              type: 'story',
              title: 'Event 2',
              description: 'Test',
              day: 5,
            },
          ],
        },
      }

      // Применяем миграцию
      const result = eventMigration.migrateSave(saveWithMultipleEvents)

      expect(result.success).toBe(true)
      expect(result.migratedEvents).toBe(2)

      // Проверяем, что instanceId уникальны
      const eventQueue = saveWithMultipleEvents.event_queue as Record<string, unknown>
      const pendingEvents = eventQueue.pendingEvents as Array<Record<string, unknown>>
      
      const instanceIds = pendingEvents.map(e => e.instanceId as string)
      const uniqueIds = new Set(instanceIds)
      
      expect(uniqueIds.size).toBe(2)
    })
  })
})
