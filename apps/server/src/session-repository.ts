import type {
  CommandLogRepository,
  GameStateRecord,
  GameStateRepository,
  ProcessedCommandRecord,
  UnitOfWork,
  UnitOfWorkContext,
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
    const record: StoredSession | undefined = Array.from(this.sessions.values()).find(
      (candidate) => candidate.playerId === playerId,
    )

    if (!record || (record.expiresAt !== null && record.expiresAt.getTime() <= Date.now())) {
      if (record) this.sessions.delete(record.sessionId)
      return null
    }

    return cloneRecord(record)
  }

  public async create(record: GameStateRecord<GameWorldJSON>): Promise<void> {
    this.sessions.set(record.sessionId, {
      ...cloneRecord(record),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    })
  }

  public async saveIfVersionMatches(
    sessionId: string,
    expectedStateVersion: number,
    state: GameWorldJSON,
  ): Promise<GameStateRecord<GameWorldJSON>> {
    const current: StoredSession | undefined = this.sessions.get(sessionId)

    if (!current || (current.expiresAt !== null && current.expiresAt.getTime() <= Date.now())) {
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
      createdAt: current.createdAt,
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    }
    this.sessions.set(sessionId, next)
    return cloneRecord(next)
  }
}

export interface MemoryCommandResult {
  success: boolean
  message: string
}

export class MemoryCommandLogRepository<TResult extends MemoryCommandResult = MemoryCommandResult> implements CommandLogRepository<TResult> {
  private readonly commands: Map<string, ProcessedCommandRecord<TResult>> = new Map()

  public async find(playerId: string, commandId: string): Promise<ProcessedCommandRecord<TResult> | null> {
    return this.commands.get(`${playerId}:${commandId}`) ?? null
  }

  public async record(command: ProcessedCommandRecord<TResult>): Promise<void> {
    this.commands.set(`${command.playerId}:${command.commandId}`, structuredClone(command))
  }
}

export class MemoryUnitOfWork<TResult extends MemoryCommandResult = MemoryCommandResult> implements UnitOfWork<GameWorldJSON, TResult> {
  private readonly commandLogRepository: MemoryCommandLogRepository<TResult> = new MemoryCommandLogRepository<TResult>()

  public constructor(private readonly gameStateRepository: GameStateRepository<GameWorldJSON>) {}

  public async run<T>(work: (context: UnitOfWorkContext<GameWorldJSON, TResult>) => Promise<T>): Promise<T> {
    return work({
      gameStateRepository: this.gameStateRepository,
      commandLogRepository: this.commandLogRepository,
    })
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
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
    expiresAt: record.expiresAt === null ? null : new Date(record.expiresAt),
  }
}
