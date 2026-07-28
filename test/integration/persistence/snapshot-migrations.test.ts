import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  CURRENT_SNAPSHOT_VERSION,
  SnapshotMigrationError,
  migrateSnapshot,
} from '../../../apps/server/src/infrastructure/persistence/snapshot-migrations'

describe('snapshot migration fixtures', () => {
  it('preserves current snapshot and rejects future snapshot without overwrite', () => {
    const current = GameWorld.createEmpty().toJSON()
    expect(migrateSnapshot(current, CURRENT_SNAPSHOT_VERSION)).toEqual(current)
    expect(() => migrateSnapshot(current, CURRENT_SNAPSHOT_VERSION + 1)).toThrow(SnapshotMigrationError)
    expect(current).toEqual(GameWorld.createEmpty().toJSON())
  })
})
