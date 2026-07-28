import type { CommandResultDto, ErrorResponse } from './api.types'
import type { GameCommandType } from './command.types'

export interface GameStateResponse<TState = unknown> {
  state: TState
  sessionId: string
  version: string
  stateVersion?: number
}

export interface ActionExecuteResponse<TState = unknown> {
  result: CommandResultDto
  state: TState
  stateVersion?: number
}

export interface InitRequestBody<TState = unknown> {
  saveData?: TState
  replace?: boolean
}

export interface MutationMetadata {
  commandId?: string
  expectedStateVersion?: number
}

export interface ActionExecuteRequest extends MutationMetadata {
  actionId: string
}

export interface WorkShiftRequest extends MutationMetadata {
  hours: number
}

export interface EventResolveRequest extends MutationMetadata {
  eventId: string
  choiceId: string
}

export interface CareerChangeRequest extends MutationMetadata {
  jobId: string
}

export interface InvestRequest extends MutationMetadata {
  amount: number
  type: 'deposit' | 'stocks' | 'business'
  returnRate?: number
}

export interface QueuedCommand {
  type: GameCommandType
  payload: Record<string, unknown>
  timestamp: number
  commandId?: string
  expectedStateVersion?: number
}

export interface SyncRequest {
  actions: QueuedCommand[]
}

export interface SyncResponse<TState = unknown> {
  state: TState
  applied: number
  failed: number
  errors?: ErrorResponse[]
  stateVersion?: number
}
