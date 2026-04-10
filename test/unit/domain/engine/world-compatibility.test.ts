import { describe, expect, test } from 'vitest'
import { GameWorld } from '@/domain/engine/world'

describe('GameWorld legacy/canonical compatibility', () => {
  test('reads legacy keys through canonical names', () => {
    const world = new GameWorld()
    world.entities.set('player', { id: 'player', components: new Set() })
    world.addComponent('player', 'event_queue', { queue: [], currentEvent: null })
    world.addComponent('player', 'event_history', { history: [] })
    world.addComponent('player', 'lifetime_stats', { totalDaysWorked: 1 })
    world.addComponent('player', 'activity_log', { entries: [] })

    expect(world.getComponent('player', 'eventQueue')).toBeTruthy()
    expect(world.getComponent('player', 'eventHistory')).toBeTruthy()
    expect(world.getComponent('player', 'lifetimeStats')).toBeTruthy()
    expect(world.getComponent('player', 'activityLog')).toBeTruthy()
  })

  test('serializes canonical runtime keys to legacy save keys', () => {
    const world = new GameWorld()
    world.entities.set('player', { id: 'player', components: new Set() })
    world.addComponent('player', 'eventQueue', { queue: [], currentEvent: null })
    world.addComponent('player', 'eventHistory', { history: [{ eventId: 'e1', day: 1 }] })

    const json = world.toJSON()
    const player = json.entities.find((entity) => entity.id === 'player')
    expect(player).toBeTruthy()
    expect(player?.components.event_queue).toBeTruthy()
    expect(player?.components.event_history).toBeTruthy()
    expect(player?.components.eventQueue).toBeUndefined()
    expect(player?.components.eventHistory).toBeUndefined()
  })
})
