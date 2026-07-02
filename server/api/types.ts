/**
 * Re-export API contract types из src/domain/api-contract/ (нейтральный слой).
 *
 * Типы лежат в domain, чтобы и client (src/application, src/stores), и server
 * (server/api) могли их импортировать без нарушения правила
 * nuxt/server-client-boundary.
 */
export type {
  ApiResponse,
  ErrorResponse,
  ApiErrorCode,
  CommandResultDto,
  GameStateResponse,
  ActionExecuteResponse,
  ActionExecuteRequest,
  InitRequestBody,
  WorkShiftRequest,
  EventResolveRequest,
  CareerChangeRequest,
  InvestRequest,
  SyncRequest,
  SyncResponse,
} from '@/domain/api-contract'
