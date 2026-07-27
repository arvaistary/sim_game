export interface GameStateRecord<TState = unknown> {
  sessionId: string
  playerId: string
  state: TState
  schemaVersion: number
  stateVersion: number
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
}

export interface CommandLogRepository<TResult = unknown> {
  find(playerId: string, commandId: string): Promise<ProcessedCommandRecord<TResult> | null>
  record(command: ProcessedCommandRecord<TResult>): Promise<void>
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>
}

export interface PlayerIdentity {
  provider: 'local' | 'yandex'
  providerPlayerId: string
}

export interface PlayerIdentityProvider {
  resolve(request: unknown): Promise<PlayerIdentity>
}
