import { describe, expect, test } from 'vitest'
import { ALL_CHILDHOOD_EVENTS } from '../../../../src/domain/balance/constants/childhood-events/index'

describe('find dupe', () => {
  test('find duplicate IDs', () => {
    const ids = ALL_CHILDHOOD_EVENTS.map(e => e.id)
    const seen = new Map<string, number>()
    const dupes: string[] = []
    for (const id of ids) {
      seen.set(id, (seen.get(id) || 0) + 1)
      if (seen.get(id)! > 1) dupes.push(id)
    }
    console.log('Total:', ids.length, 'Unique:', new Set(ids).size)
    console.log('Duplicates:', dupes)
    for (const dupe of dupes) {
      const events = ALL_CHILDHOOD_EVENTS.filter(e => e.id === dupe)
      console.log(`Dupe "${dupe}":`, events.map(e => ({ id: e.id, type: e.type, minAge: e.minAge })))
    }
    expect(dupes).toEqual([])
  })
})
