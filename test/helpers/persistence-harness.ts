import { Pool } from 'pg'

export interface PersistenceTestHarness {
  databaseUrl: string
  pool: Pool
  reset: () => Promise<void>
  close: () => Promise<void>
}

export function createPersistenceTestHarness(
  databaseUrl: string = process.env.DATABASE_URL ?? 'postgres://game:game@127.0.0.1:5432/game_life',
): PersistenceTestHarness {
  const pool: Pool = new Pool({ connectionString: databaseUrl })

  return {
    databaseUrl,
    pool,
    async reset(): Promise<void> {
      await pool.query('TRUNCATE TABLE processed_commands, game_sessions, players CASCADE')
    },
    async close(): Promise<void> {
      await pool.end()
    },
  }
}
