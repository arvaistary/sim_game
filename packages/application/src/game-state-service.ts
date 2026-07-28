import type {
  GameStateRecord,
  ProcessedCommandRecord,
} from './ports.types'
import type {
  CommandServiceResult,
  GameCommandRequest,
  GameStateServiceDependencies,
} from './game-state-service.types'

export class CommandIdConflictError extends Error {
  public constructor(commandId: string) {
    super(`Command id already used with different payload: ${commandId}`)
    this.name = 'CommandIdConflictError'
  }
}

export class StateVersionConflictError extends Error {
  public readonly expectedStateVersion: number
  public readonly actualStateVersion: number

  public constructor(expectedStateVersion: number, actualStateVersion: number) {
    super(`State version conflict: expected ${expectedStateVersion}, actual ${actualStateVersion}`)
    this.name = 'StateVersionConflictError'
    this.expectedStateVersion = expectedStateVersion
    this.actualStateVersion = actualStateVersion
  }
}

export class SessionNotFoundError extends Error {
  public constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`)
    this.name = 'SessionNotFoundError'
  }
}

export class GameStateService<TState, TResult extends { success: boolean } = { success: boolean; message: string }> {
  public constructor(private readonly dependencies: GameStateServiceDependencies<TState, TResult>) {}

  public async execute(
    playerId: string,
    sessionId: string,
    command: GameCommandRequest,
  ): Promise<CommandServiceResult<TState, TResult>> {
    const requestHash: string = this.dependencies.requestHash(command)
    return this.dependencies.unitOfWork.run(async ({ gameStateRepository, commandLogRepository }) => {
      const existing: ProcessedCommandRecord<TResult> | null = await commandLogRepository.find(
        playerId,
        command.commandId,
      )
      if (existing) {
        if (existing.requestHash !== requestHash) throw new CommandIdConflictError(command.commandId)
        const current: GameStateRecord<TState> | null = await gameStateRepository.findByPlayerId(playerId)
        if (!current) throw new SessionNotFoundError(sessionId)
        return {
          state: current.state,
          stateVersion: existing.stateVersionAfter,
          result: existing.result,
          replayed: true,
        }
      }

      const current: GameStateRecord<TState> | null = await gameStateRepository.findByPlayerId(playerId)
      if (!current || current.sessionId !== sessionId) throw new SessionNotFoundError(sessionId)
      const expectedStateVersion: number = command.expectedStateVersion ?? current.stateVersion
      if (current.stateVersion !== expectedStateVersion) {
        throw new StateVersionConflictError(expectedStateVersion, current.stateVersion)
      }

      const execution = await this.dependencies.executor.execute(current.state, command)
      let saved: GameStateRecord<TState> = current
      if (execution.result.success) {
        try {
          saved = await gameStateRepository.saveIfVersionMatches(sessionId, expectedStateVersion, execution.state)
        } catch (error) {
          const conflict = error as {
            code?: string
            actualStateVersion?: number
            details?: { actualStateVersion?: number }
          }
          if (conflict.code === 'conflict' || error instanceof Error && error.name === 'SessionStateConflictError') {
            throw new StateVersionConflictError(
              expectedStateVersion,
              conflict.actualStateVersion ?? conflict.details?.actualStateVersion ?? current.stateVersion + 1,
            )
          }
          throw error
        }
      }
      const record: ProcessedCommandRecord<TResult> = {
        playerId,
        sessionId,
        commandId: command.commandId,
        requestHash,
        result: execution.result,
        commandType: command.type,
        stateVersionBefore: current.stateVersion,
        stateVersionAfter: saved.stateVersion,
        createdAt: (this.dependencies.now ?? (() => new Date()))(),
      }
      await commandLogRepository.record(record)
      return {
        state: saved.state,
        stateVersion: saved.stateVersion,
        result: execution.result,
        replayed: false,
      }
    })
  }
}
