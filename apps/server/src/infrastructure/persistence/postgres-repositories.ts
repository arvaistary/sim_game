import type {
  CommandLogRepository,
  GameStateRecord,
  GameStateRepository,
  ProcessedCommandRecord,
  UnitOfWork,
  UnitOfWorkContext,
} from '@game-life/application'
import type { Pool, PoolClient, QueryResultRow } from 'pg'

import { PersistenceError } from './errors'

interface DatabaseExecutor {
  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

interface SessionRow extends QueryResultRow {
  session_id: string
  player_id: string
  state: unknown
  schema_version: number
  state_version: number
  created_at: Date
  updated_at: Date
  expires_at: Date | null
}

interface CommandRow extends QueryResultRow {
  player_id: string
  session_id: string
  command_id: string
  request_hash: string
  command_type: string
  state_version_before: number
  state_version_after: number
  result: unknown
  created_at: Date
}

export class PostgresGameStateRepository<TState = unknown> implements GameStateRepository<TState> {
  public constructor(private readonly executor: DatabaseExecutor) {}

  public async findByPlayerId(playerId: string): Promise<GameStateRecord<TState> | null> {
    try {
      const result = await this.executor.query<SessionRow>(
        `SELECT session_id, player_id, state, schema_version, state_version,
                created_at, updated_at, expires_at
           FROM game_sessions
          WHERE player_id = $1
            AND (expires_at IS NULL OR expires_at > NOW())
          ORDER BY updated_at DESC
          LIMIT 1`,
        [playerId],
      )
      return result.rows[0] ? mapSession<TState>(result.rows[0]) : null
    } catch (error) {
      throw unavailable(error)
    }
  }

  public async create(record: GameStateRecord<TState>): Promise<void> {
    try {
      await this.executor.query(
        `INSERT INTO players (player_id, provider, provider_player_id)
         VALUES ($1, 'local', $1)
         ON CONFLICT (player_id) DO NOTHING`,
        [record.playerId],
      )
      await this.executor.query(
        `INSERT INTO game_sessions
          (session_id, player_id, state, schema_version, state_version, created_at, updated_at, expires_at)
         VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8)`,
        [
          record.sessionId,
          record.playerId,
          JSON.stringify(record.state),
          record.schemaVersion,
          record.stateVersion,
          record.createdAt,
          record.updatedAt,
          record.expiresAt,
        ],
      )
    } catch (error) {
      throw unavailable(error)
    }
  }

  public async saveIfVersionMatches(
    sessionId: string,
    expectedStateVersion: number,
    state: TState,
  ): Promise<GameStateRecord<TState>> {
    try {
      const result = await this.executor.query<SessionRow>(
        `UPDATE game_sessions
            SET state = $1::jsonb,
                state_version = state_version + 1,
                updated_at = NOW()
          WHERE session_id = $2
            AND state_version = $3
            AND (expires_at IS NULL OR expires_at > NOW())
        RETURNING session_id, player_id, state, schema_version, state_version,
                  created_at, updated_at, expires_at`,
        [JSON.stringify(state), sessionId, expectedStateVersion],
      )
      if (result.rows[0]) {
        return mapSession<TState>(result.rows[0])
      }

      const current = await this.executor.query<{ state_version: number }>(
        'SELECT state_version FROM game_sessions WHERE session_id = $1',
        [sessionId],
      )
      if (!current.rows[0]) {
        throw new PersistenceError('not_found', `Session not found: ${sessionId}`)
      }
      throw new PersistenceError(
        'conflict',
        `State version conflict: expected ${expectedStateVersion}, actual ${current.rows[0].state_version}`,
        undefined,
        {
          sessionId,
          expectedStateVersion,
          actualStateVersion: current.rows[0].state_version,
        },
      )
    } catch (error) {
      if (error instanceof PersistenceError) throw error
      throw unavailable(error)
    }
  }
}

export class PostgresCommandLogRepository<TResult = unknown> implements CommandLogRepository<TResult> {
  public constructor(private readonly executor: DatabaseExecutor) {}

  public async find(playerId: string, commandId: string): Promise<ProcessedCommandRecord<TResult> | null> {
    try {
      const result = await this.executor.query<CommandRow>(
        `SELECT player_id, session_id, command_id, request_hash, command_type,
                state_version_before, state_version_after, result, created_at
           FROM processed_commands
          WHERE player_id = $1 AND command_id = $2`,
        [playerId, commandId],
      )
      return result.rows[0] ? mapCommand<TResult>(result.rows[0]) : null
    } catch (error) {
      throw unavailable(error)
    }
  }

  public async record(command: ProcessedCommandRecord<TResult>): Promise<void> {
    try {
      await this.executor.query(
        `INSERT INTO processed_commands
          (player_id, session_id, command_id, request_hash, command_type,
           state_version_before, state_version_after, result, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
        [
          command.playerId,
          command.sessionId,
          command.commandId,
          command.requestHash,
          command.commandType,
          command.stateVersionBefore,
          command.stateVersionAfter,
          JSON.stringify(command.result),
          command.createdAt,
        ],
      )
    } catch (error) {
      throw unavailable(error)
    }
  }
}

export class PostgresUnitOfWork<TState = unknown, TResult = unknown> implements UnitOfWork<TState, TResult> {
  public constructor(private readonly pool: Pool) {}

  public async run<T>(work: (context: UnitOfWorkContext<TState, TResult>) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const context: UnitOfWorkContext<TState, TResult> = {
        gameStateRepository: new PostgresGameStateRepository<TState>(client),
        commandLogRepository: new PostgresCommandLogRepository<TResult>(client),
      }
      const value: T = await work(context)
      await client.query('COMMIT')
      return value
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }
}

function mapSession<TState>(row: SessionRow): GameStateRecord<TState> {
  return {
    sessionId: row.session_id,
    playerId: row.player_id,
    state: row.state as TState,
    schemaVersion: row.schema_version,
    stateVersion: row.state_version,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
  }
}

function mapCommand<TResult>(row: CommandRow): ProcessedCommandRecord<TResult> {
  return {
    playerId: row.player_id,
    sessionId: row.session_id,
    commandId: row.command_id,
    requestHash: row.request_hash,
    commandType: row.command_type,
    stateVersionBefore: row.state_version_before,
    stateVersionAfter: row.state_version_after,
    result: row.result as TResult,
    createdAt: new Date(row.created_at),
  }
}

function unavailable(error: unknown): PersistenceError {
  return new PersistenceError(
    'unavailable',
    error instanceof Error ? error.message : 'Database operation failed',
    error instanceof Error ? { cause: error } : undefined,
  )
}
