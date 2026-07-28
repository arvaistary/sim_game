import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  CURRENT_SNAPSHOT_VERSION,
  SnapshotMigrationError,
  migrateSnapshot,
} from '../../../apps/server/src/infrastructure/persistence/snapshot-migrations'

describe('snapshot migrations', () => {
  it('accepts current snapshot and returns a detached copy', () => {
    const source = GameWorld.createEmpty().toJSON()
    const migrated = migrateSnapshot(source, CURRENT_SNAPSHOT_VERSION)

    expect(migrated).toEqual(source)
    expect(migrated).not.toBe(source)
  })

  it('rejects unsupported future version without mutating input', () => {
    const source = GameWorld.createEmpty().toJSON()

    expect(() => migrateSnapshot(source, CURRENT_SNAPSHOT_VERSION + 1)).toThrow(SnapshotMigrationError)
    expect(source).toEqual(GameWorld.createEmpty().toJSON())
  })

  it('rejects invalid snapshot shape', () => {
    expect(() => migrateSnapshot({ version: '1.1.0' }, CURRENT_SNAPSHOT_VERSION)).toThrow(SnapshotMigrationError)
  })
})
