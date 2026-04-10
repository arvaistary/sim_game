import { describe, expect, test } from 'vitest'
import { getAllActions } from '@/domain/balance/actions'

describe('domain/balance actions catalog', () => {
  test('returns non-empty action list', () => {
    const actions = getAllActions()
    expect(actions.length).toBeGreaterThan(0)
  })

  test.todo('validates unique action ids across all categories')
  test.todo('validates required metadata for every action')
})
