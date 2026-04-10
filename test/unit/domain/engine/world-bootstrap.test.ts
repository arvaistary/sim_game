import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'

describe('domain/engine world bootstrap', () => {
  test('creates world instance from save payload', () => {
    const world = createWorldFromSave({ playerName: 'Tester' })
    expect(world).toBeTruthy()
  })

  test.todo('applies initial engine components for new game')
  test.todo('restores pending events and investments from save payload')
})
