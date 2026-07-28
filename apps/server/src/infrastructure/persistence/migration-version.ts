export interface MigrationManifestEntry {
  ordinal: number
  name: string
}

export const MIGRATION_MANIFEST: readonly MigrationManifestEntry[] = [
  { ordinal: 1, name: '0001_durable_game_state' },
]

export const CURRENT_SCHEMA_VERSION = MIGRATION_MANIFEST.length
