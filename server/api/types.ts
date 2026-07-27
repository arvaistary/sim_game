/**
 * Server compatibility facade over canonical `@game-life/contracts`.
 * State payload remains specialized to current GameWorld during extraction.
 */
import type {
  ActionExecuteResponse as ContractActionExecuteResponse,
  GameStateResponse as ContractGameStateResponse,
  InitRequestBody as ContractInitRequestBody,
  SyncResponse as ContractSyncResponse,
} from '@game-life/contracts'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

export type {
  ActionExecuteRequest,
  ApiErrorCode,
  ApiResponse,
  CareerChangeRequest,
  CommandResultDto,
  ErrorResponse,
  EventResolveRequest,
  InvestRequest,
  SyncRequest,
  WorkShiftRequest,
} from '@game-life/contracts'

export type GameStateResponse = ContractGameStateResponse<GameWorldJSON>
export type ActionExecuteResponse = ContractActionExecuteResponse<GameWorldJSON>
export type InitRequestBody = ContractInitRequestBody<GameWorldJSON>
export type SyncResponse = ContractSyncResponse<GameWorldJSON>
