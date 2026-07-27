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
}

export interface ActionExecuteRequest {
  actionId: string
}

export interface WorkShiftRequest {
  hours: number
}

export interface EventResolveRequest {
  eventId: string
  choiceId: string
}

export interface CareerChangeRequest {
  jobId: string
}

export interface InvestRequest {
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
