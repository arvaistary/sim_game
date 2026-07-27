import type {
  GameStateRecord,
  GameStateRepository,
} from '@game-life/application'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { StoredSession } from './session-repository.types'

const SESSION_TTL_MS: number = 24 * 60 * 60 * 1000

export class SessionNotFoundError extends Error {
  public constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`)
    this.name = 'SessionNotFoundError'
  }
}

export class SessionStateConflictError extends Error {
  public readonly expectedStateVersion: number
  public readonly actualStateVersion: number

  public constructor(expectedStateVersion: number, actualStateVersion: number) {
    super(`State version conflict: expected ${expectedStateVersion}, actual ${actualStateVersion}`)
    this.name = 'SessionStateConflictError'
    this.expectedStateVersion = expectedStateVersion
    this.actualStateVersion = actualStateVersion
  }
}

export class MemoryGameStateRepository implements GameStateRepository<GameWorldJSON> {
  private readonly sessions: Map<string, StoredSession> = new Map<string, StoredSession>()

  public async findByPlayerId(playerId: string): Promise<GameStateRecord<GameWorldJSON> | null> {
    const record: StoredSession | undefined = this.sessions.get(playerId)

    if (!record || record.expiresAt <= Date.now()) {
      this.sessions.delete(playerId)
      return null
    }

    return cloneRecord(record)
  }

  public async create(record: GameStateRecord<GameWorldJSON>): Promise<void> {
    this.sessions.set(record.playerId, {
      ...cloneRecord(record),
      expiresAt: Date.now() + SESSION_TTL_MS,
    })
  }

  public async saveIfVersionMatches(
    sessionId: string,
    expectedStateVersion: number,
    state: GameWorldJSON,
  ): Promise<GameStateRecord<GameWorldJSON>> {
    const current: StoredSession | undefined = this.sessions.get(sessionId)

    if (!current || current.expiresAt <= Date.now()) {
      this.sessions.delete(sessionId)
      throw new SessionNotFoundError(sessionId)
    }

    if (current.stateVersion !== expectedStateVersion) {
      throw new SessionStateConflictError(expectedStateVersion, current.stateVersion)
    }

    const next: StoredSession = {
      sessionId,
      playerId: current.playerId,
      state: cloneState(state),
      schemaVersion: current.schemaVersion,
      stateVersion: current.stateVersion + 1,
      expiresAt: Date.now() + SESSION_TTL_MS,
    }
    this.sessions.set(sessionId, next)
    return cloneRecord(next)
  }
}

function cloneState(state: GameWorldJSON): GameWorldJSON {
  return structuredClone(state)
}

function cloneRecord(record: GameStateRecord<GameWorldJSON>): GameStateRecord<GameWorldJSON> {
  return {
    sessionId: record.sessionId,
    playerId: record.playerId,
    state: cloneState(record.state),
    schemaVersion: record.schemaVersion,
    stateVersion: record.stateVersion,
  }
}
