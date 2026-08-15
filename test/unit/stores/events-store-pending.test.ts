import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEventsStore } from '@/stores/events-store'
import type { GameEvent } from '@/stores/events-store/events-store.types'

function sampleEvent(id: string): GameEvent {
  return {
    id,
    instanceId: `${id}_1`,
    type: 'weekly',
    title: 'Test',
    description: 'desc',
    choices: [],
    priority: 'normal',
  }
}

describe('events-store pending indicators', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('hasPendingEvents is true when queue has items and current is empty', () => {
    const store = useEventsStore()

    store.addToQueue(sampleEvent('weekly_summary'))

    expect(store.currentEvent).toBeNull()
    expect(store.queueLength).toBe(1)
    expect(store.hasPendingEvents).toBe(true)
  })

  it('hasPendingEvents stays true while currentEvent is set', () => {
    const store = useEventsStore()

    store.addToQueue(sampleEvent('yearly_reflection'))
    store.showNextEvent()

    expect(store.currentEvent?.id).toBe('yearly_reflection')
    expect(store.hasPendingEvents).toBe(true)
  })
})
