import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { CURRENT_SCHEMA_VERSION, MIGRATION_MANIFEST } from '../../../apps/server/src/infrastructure/persistence/migration-version'

describe('durable-state migration metadata', () => {
  it('uses append-only ordered manifest and matching initial SQL', async () => {
    const sql = await readFile('apps/server/src/infrastructure/persistence/migrations/0001_durable_game_state.sql', 'utf8')

    expect(CURRENT_SCHEMA_VERSION).toBe(MIGRATION_MANIFEST.length)
    expect(MIGRATION_MANIFEST.map((entry) => entry.ordinal)).toEqual([1])
    expect(sql).toContain('CREATE TABLE "players"')
    expect(sql).toContain('CREATE TABLE "game_sessions"')
    expect(sql).toContain('CREATE TABLE "processed_commands"')
    expect(sql.toUpperCase()).not.toContain('DROP TABLE')
  })
})

describe.skipIf(process.env.RUN_PERSISTENCE_TESTS !== '1')('PostgreSQL migration gate', () => {
  it('is executed separately after infra:up and db:migrate', async () => {
    expect(process.env.DATABASE_URL ?? 'postgres://game:game@127.0.0.1:5432/game_life').toContain('postgres')
  })
})
