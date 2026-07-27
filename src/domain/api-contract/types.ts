/**
 * Compatibility facade for legacy Nuxt imports.
 * Canonical transport contracts live in `@game-life/contracts`.
 */
import type {
  ActionExecuteResponse as ContractActionExecuteResponse,
  GameStateResponse as ContractGameStateResponse,
  InitRequestBody as ContractInitRequestBody,
  SyncResponse as ContractSyncResponse,
} from '@game-life/contracts'
import type { GameWorldJSON } from '../game-world/GameWorld.types'

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
