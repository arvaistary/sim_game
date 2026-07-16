/**
 * Shared API contract types (server-first migration, Stage 1 + 5).
 *
 * Лежат в domain (нейтральный слой), чтобы и client (src/application, src/stores),
 * и server (server/api) могли их импортировать без нарушения архитектурных правил
 * (nuxt/server-client-boundary: server/** не импортируется в src/**).
 *
 * Реальные endpoint-имплементации используют эти типы; server/api/types.ts
 * реэкспортирует их для server-side convenience.
 */
import type { GameWorldJSON } from '../game-world/GameWorld.types'

/**
 * Простой результат команды (без circular dep на application layer).
 * Дублирует ExecuteActionCommandResult из application/game/index.types,
 * но т.к. domain не может импортировать application, держим локальный контракт.
 */
export interface CommandResultDto {
  success: boolean
  message: string
}

/**
 * Универсальный API response envelope.
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: ErrorResponse
  timestamp: number
}

/**
 * Структура ошибки.
 */
export interface ErrorResponse {
  code: string
  message: string
  details?: Record<string, unknown>
}

/**
 * Коды ошибок API (для client-side switch).
 */
export type ApiErrorCode =
  | 'session_not_found'
  | 'session_expired'
  | 'validation_error'
  | 'action_not_found'
  | 'insufficient_resources'
  | 'internal_error'
  | 'network_error'

/**
 * Ответ на инициализацию/состояние мира.
 */
export interface GameStateResponse {
  state: GameWorldJSON
  sessionId: string
  version: string
}

/**
 * Ответ на выполнение действия (включает обновлённое состояние).
 */
export interface ActionExecuteResponse {
  result: CommandResultDto
  state: GameWorldJSON
}

/**
 * Payload для POST /api/game/init.
 */
export interface InitRequestBody {
  saveData?: GameWorldJSON
}

/**
 * Payload для POST /api/game/actions/execute.
 */
export interface ActionExecuteRequest {
  actionId: string
}

/**
 * Payload для POST /api/game/work-shift.
 */
export interface WorkShiftRequest {
  hours: number
}

/**
 * Payload для POST /api/game/event/resolve.
 */
export interface EventResolveRequest {
  eventId: string
  choiceId: string
}

/**
 * Payload для POST /api/game/career/change.
 */
export interface CareerChangeRequest {
  jobId: string
}

/**
 * Payload для POST /api/game/finance/invest.
 */
export interface InvestRequest {
  amount: number
  type: 'deposit' | 'stocks' | 'business'
  returnRate?: number
}

/**
 * Payload для POST /api/game/sync (offline queue flush).
 */
export interface SyncRequest {
  actions: Array<{
    type: 'action' | 'work' | 'event' | 'career' | 'finance' | 'education'
    payload: Record<string, unknown>
    timestamp: number
  }>
}

/**
 * Ответ на sync — финальное состояние после применения всех действий.
 */
export interface SyncResponse {
  state: GameWorldJSON
  applied: number
  failed: number
  errors?: ErrorResponse[]
}
