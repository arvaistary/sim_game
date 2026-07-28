import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

export const CURRENT_SNAPSHOT_VERSION = 1

export class SnapshotMigrationError extends Error {
  public constructor(message: string) {
    super(message)
    this.name = 'SnapshotMigrationError'
  }
}

interface SnapshotMigration {
  from: number
  to: number
  migrate: (snapshot: GameWorldJSON) => GameWorldJSON
}

const SNAPSHOT_MIGRATIONS: readonly SnapshotMigration[] = []

export function migrateSnapshot(snapshot: unknown, fromVersion: number): GameWorldJSON {
  if (!Number.isInteger(fromVersion) || fromVersion < 1) {
    throw new SnapshotMigrationError(`Unsupported snapshot version: ${fromVersion}`)
  }
  if (fromVersion > CURRENT_SNAPSHOT_VERSION) {
    throw new SnapshotMigrationError(`Unsupported future snapshot version: ${fromVersion}`)
  }

  let current: GameWorldJSON = cloneAndValidate(snapshot)
  let version: number = fromVersion
  while (version < CURRENT_SNAPSHOT_VERSION) {
    const migration: SnapshotMigration | undefined = SNAPSHOT_MIGRATIONS.find((item) => item.from === version)
    if (!migration) throw new SnapshotMigrationError(`Missing migration from snapshot version ${version}`)
    current = cloneAndValidate(migration.migrate(current))
    version = migration.to
  }
  return current
}

function cloneAndValidate(snapshot: unknown): GameWorldJSON {
  if (snapshot === null || typeof snapshot !== 'object') {
    throw new SnapshotMigrationError('Snapshot must be an object')
  }
  try {
    const copy: GameWorldJSON = structuredClone(snapshot) as GameWorldJSON
    return GameWorld.fromJSON(copy).toJSON()
  } catch (error) {
    throw new SnapshotMigrationError(error instanceof Error ? error.message : 'Invalid game snapshot')
  }
}
