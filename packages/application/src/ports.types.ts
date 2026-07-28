export interface GameStateRecord<TState = unknown> {
  sessionId: string
  playerId: string
  state: TState
  schemaVersion: number
  stateVersion: number
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
}

export interface GameStateRepository<TState = unknown> {
  findByPlayerId(playerId: string): Promise<GameStateRecord<TState> | null>
  create(record: GameStateRecord<TState>): Promise<void>
  saveIfVersionMatches(
    sessionId: string,
    expectedStateVersion: number,
    state: TState,
  ): Promise<GameStateRecord<TState>>
}

export interface ProcessedCommandRecord<TResult = unknown> {
  playerId: string
  sessionId: string
  commandId: string
  requestHash: string
  result: TResult
  commandType: string
  stateVersionBefore: number
  stateVersionAfter: number
  createdAt: Date
}

export interface CommandLogRepository<TResult = unknown> {
  find(playerId: string, commandId: string): Promise<ProcessedCommandRecord<TResult> | null>
  record(command: ProcessedCommandRecord<TResult>): Promise<void>
}

export interface UnitOfWorkContext<TState = unknown, TResult = unknown> {
  gameStateRepository: GameStateRepository<TState>
  commandLogRepository: CommandLogRepository<TResult>
}

export interface UnitOfWork<TState = unknown, TResult = unknown> {
  run<T>(work: (context: UnitOfWorkContext<TState, TResult>) => Promise<T>): Promise<T>
}

export interface DomainCommand {
  type: string
  payload: Record<string, unknown>
}

export interface DomainCommandExecution<TState = unknown, TResult = unknown> {
  state: TState
  result: TResult
}

export interface DomainCommandExecutor<TState = unknown, TResult = unknown> {
  execute(
    state: TState,
    command: DomainCommand,
  ): Promise<DomainCommandExecution<TState, TResult>> | DomainCommandExecution<TState, TResult>
}

export interface PlayerIdentity {
  provider: 'local' | 'yandex'
  providerPlayerId: string
}

export interface PlayerIdentityProvider {
  resolve(request: unknown): Promise<PlayerIdentity>
}
