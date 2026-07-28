import type {
  DomainCommandExecutor,
  UnitOfWork,
} from './ports.types'

export interface CommandServiceResult<TState = unknown, TResult extends { success: boolean } = { success: boolean; message: string }> {
  state: TState
  stateVersion: number
  result: TResult
  replayed: boolean
}

export interface GameCommandRequest {
  commandId: string
  expectedStateVersion?: number
  type: string
  payload: Record<string, unknown>
}

export interface GameStateServiceDependencies<TState, TResult extends { success: boolean }> {
  unitOfWork: UnitOfWork<TState, TResult>
  executor: DomainCommandExecutor<TState, TResult>
  requestHash: (command: GameCommandRequest) => string
  now?: () => Date
}
