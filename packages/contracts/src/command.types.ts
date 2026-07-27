import type { CommandResultDto } from './api.types'

export type StateVersion = number

export type GameCommandType =
  | 'action'
  | 'work'
  | 'event'
  | 'career'
  | 'finance'
  | 'education'

export interface CommandEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  commandId: string
  expectedStateVersion?: StateVersion
  type: GameCommandType
  payload: TPayload
  timestamp: number
}

export interface CommandResult<TState = unknown> {
  commandId: string
  stateVersion: StateVersion
  state: TState
  result: CommandResultDto
}
