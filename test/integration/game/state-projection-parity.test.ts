import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { applyToStores } from '@/domain/game-world/bridge'

describe('state projection parity', () => {
  it('projects canonical world state into every available store adapter', () => {
    const world = GameWorld.createEmpty({ player: { playerName: 'Projection', startAge: 20, currentAge: 20 } })
    const loaded: Record<string, Record<string, unknown>> = {}
    const stores = Object.fromEntries(['player', 'time', 'stats', 'wallet', 'skills', 'career', 'education', 'housing', 'events', 'finance', 'activity'].map(key => [key, { load: (data: Record<string, unknown>) => { loaded[key] = data } }]))
    applyToStores(world, stores)
    expect(loaded.player.name).toBe('Projection')
    expect(loaded.time.totalHours).toBe(world.time.totalHours)
    expect(loaded.wallet.money).toBe(world.wallet.money)
  })
})
