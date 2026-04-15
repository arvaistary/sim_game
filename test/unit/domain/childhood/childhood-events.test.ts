import { describe, expect, test } from 'vitest'
import {
  ALL_CHILDHOOD_EVENTS,
  CHILDHOOD_EVENTS_BY_AGE_GROUP,
  CHILDHOOD_EVENTS_STATS,
  getChildhoodEventsForAge,
  getChildhoodEventById,
  getChildhoodEventsByChain,
} from '@/domain/balance/constants/childhood-events'
import { AgeGroup } from '@/domain/balance/actions/types'
import type { ChildhoodEventDef } from '@/domain/balance/types/childhood-event'

describe('domain/childhood events registry', () => {
  test('ALL_CHILDHOOD_EVENTS is non-empty', () => {
    expect(ALL_CHILDHOOD_EVENTS.length).toBeGreaterThan(0)
  })

  test('total count matches stats', () => {
    expect(ALL_CHILDHOOD_EVENTS.length).toBe(CHILDHOOD_EVENTS_STATS.total)
  })

  test('every event has required fields', () => {
    for (const event of ALL_CHILDHOOD_EVENTS) {
      expect(event.id, `Event "${event.title}" missing id`).toBeTruthy()
      expect(event.title, `Event "${event.id}" missing title`).toBeTruthy()
      expect(event.description, `Event "${event.id}" missing description`).toBeTruthy()
      expect(event.ageGroup, `Event "${event.id}" missing ageGroup`).toBeDefined()
      expect(event.type, `Event "${event.id}" missing type`).toBeDefined()
      expect(event.probability, `Event "${event.id}" missing probability`).toBeGreaterThanOrEqual(0)
      expect(event.choices, `Event "${event.id}" missing choices`).toBeDefined()
      expect(event.choices.length, `Event "${event.id}" has no choices`).toBeGreaterThan(0)
    }
  })

  test('every event has unique id', () => {
    const ids = ALL_CHILDHOOD_EVENTS.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('event types are valid', () => {
    const validTypes = new Set(['everyday', 'formative', 'fateful'])
    for (const event of ALL_CHILDHOOD_EVENTS) {
      expect(validTypes.has(event.type), `Event "${event.id}" has invalid type: ${event.type}`).toBe(true)
    }
  })

  test('stats breakdown matches actual counts', () => {
    const everyday = ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'everyday').length
    const formative = ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'formative').length
    const fateful = ALL_CHILDHOOD_EVENTS.filter(e => e.type === 'fateful').length

    expect(CHILDHOOD_EVENTS_STATS.everyday).toBe(everyday)
    expect(CHILDHOOD_EVENTS_STATS.formative).toBe(formative)
    expect(CHILDHOOD_EVENTS_STATS.fateful).toBe(fateful)
  })
})

describe('domain/childhood events by age group', () => {
  test('CHILDHOOD_EVENTS_BY_AGE_GROUP has entries for all age groups', () => {
    expect(CHILDHOOD_EVENTS_BY_AGE_GROUP[AgeGroup.INFANT]).toBeTruthy()
    expect(CHILDHOOD_EVENTS_BY_AGE_GROUP[AgeGroup.CHILD]).toBeTruthy()
    expect(CHILDHOOD_EVENTS_BY_AGE_GROUP[AgeGroup.KID]).toBeTruthy()
    expect(CHILDHOOD_EVENTS_BY_AGE_GROUP[AgeGroup.TEEN]).toBeTruthy()
    expect(CHILDHOOD_EVENTS_BY_AGE_GROUP[AgeGroup.YOUNG]).toBeTruthy()
  })

  test('getChildhoodEventsForAge returns correct events', () => {
    const infantEvents = getChildhoodEventsForAge(AgeGroup.INFANT)
    expect(infantEvents.length).toBeGreaterThan(0)
    for (const event of infantEvents) {
      expect(event.ageGroup).toBe(AgeGroup.INFANT)
    }
  })

  test('getChildhoodEventById finds existing event', () => {
    const firstEvent = ALL_CHILDHOOD_EVENTS[0]
    const found = getChildhoodEventById(firstEvent.id)
    expect(found).toBe(firstEvent)
  })

  test('getChildhoodEventById returns undefined for unknown id', () => {
    expect(getChildhoodEventById('nonexistent_event')).toBeUndefined()
  })
})

describe('domain/childhood event choices', () => {
  test('every choice has label and description', () => {
    for (const event of ALL_CHILDHOOD_EVENTS) {
      for (const choice of event.choices) {
        expect(choice.label, `Choice in "${event.id}" missing label`).toBeTruthy()
        expect(choice.description, `Choice in "${event.id}" missing description`).toBeTruthy()
      }
    }
  })

  test('events with chainTag have valid chain structure', () => {
    const chainEvents = ALL_CHILDHOOD_EVENTS.filter(e => e.chainTag)
    expect(chainEvents.length).toBeGreaterThan(0)

    // Все цепочечные события должны быть formative или fateful
    for (const event of chainEvents) {
      expect(
        event.type === 'formative' || event.type === 'fateful',
        `Chain event "${event.id}" should be formative or fateful, got ${event.type}`
      ).toBe(true)
    }
  })

  test('getChildhoodEventsByChain returns events for known chain', () => {
    const mathTeacherEvents = getChildhoodEventsByChain('math_teacher')
    expect(mathTeacherEvents.length).toBeGreaterThan(0)
    for (const event of mathTeacherEvents) {
      expect(event.chainTag).toBe('math_teacher')
    }
  })

  test('getChildhoodEventsByChain returns empty for unknown chain', () => {
    expect(getChildhoodEventsByChain('nonexistent_chain')).toHaveLength(0)
  })
})
