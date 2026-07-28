import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { CURRENT_SCHEMA_VERSION } from './migration-version'
import * as schema from './schema'
import type { PersistenceReadiness } from '../../app.types'

const DEFAULT_DATABASE_URL = 'postgres://game:game@127.0.0.1:5432/game_life'

let pool: Pool | undefined

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL
}

export function getPool(): Pool {
  validateServerEnvironment()
  pool ??= new Pool({ connectionString: getDatabaseUrl() })
  return pool
}

export function getDb() {
  return drizzle(getPool(), { schema })
}

export async function closeDatabase(): Promise<void> {
  if (pool !== undefined) {
    await pool.end()
    pool = undefined
  }
}

export async function getPersistenceReadiness(): Promise<PersistenceReadiness> {
  try {
    const result = await getPool().query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM "drizzle"."__drizzle_migrations"',
    )
    const appliedMigrations: number = Number(result.rows[0]?.count ?? 0)
    const pendingMigrations: number = Math.max(CURRENT_SCHEMA_VERSION - appliedMigrations, 0)
    return {
      status: appliedMigrations === CURRENT_SCHEMA_VERSION ? 'ready' : 'not_ready',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appliedMigrations,
      pendingMigrations,
      database: 'reachable',
      ...(appliedMigrations === CURRENT_SCHEMA_VERSION
        ? {}
        : { reason: appliedMigrations < CURRENT_SCHEMA_VERSION ? 'pending_migrations' : 'migration_count_mismatch' }),
    }
  } catch {
    return {
      status: 'not_ready',
      schemaVersion: CURRENT_SCHEMA_VERSION,
      appliedMigrations: 0,
      pendingMigrations: CURRENT_SCHEMA_VERSION,
      database: 'unreachable',
      reason: 'database_unreachable',
    }
  }
}

export function validateServerEnvironment(): void {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required in production')
  }
}
