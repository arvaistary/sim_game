import { beforeEach, describe, expect, test } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '@/stores/game.store'

describe('integration/store game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  test('initializes world via facade', () => {
    const store = useGameStore()
    store.initWorld({ playerName: 'IntegrationTester' })
    expect(store.isInitialized).toBe(true)
  })

  test.todo('applies action and persists resulting state')
  test.todo('advances time and applies monthly settlement')
})
