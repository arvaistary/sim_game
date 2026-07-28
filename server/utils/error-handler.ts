/**
 * Error handler для Nitro Server API (server-first migration, Stage 4).
 *
 * Унифицированный формат ошибок: ApiResponse<T> с success=false и ErrorResponse.
 * Используется всеми server/api/** endpoints.
 */
import type { H3Event } from 'h3'
import type {
  ApiResponse,
  ApiErrorCode,
  ErrorResponse,
} from '../api/types'

/**
 * Создать ErrorResponse.
 * @description [Server] - error factory.
 * @param code код ошибки
 * @param message человекочитаемое сообщение
 * @param details опциональные детали
 * @return { ErrorResponse }
 */
export function createApiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ErrorResponse {
  return { code, message, details }
}

/**
 * Успешный API response.
 * @description [Server] - response factory.
 * @param data данные
 * @return { ApiResponse<T> }
 */
export function okResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: Date.now(),
  }
}

/**
 * Error API response.
 * @description [Server] - response factory.
 * @param error error structure
 * @return { ApiResponse<never> }
 */
export function errorResponse(error: ErrorResponse): ApiResponse<never> {
  return {
    success: false,
    error,
    timestamp: Date.now(),
  }
}

/**
 * Обработать исключение и вернуть error response.
 * @description [Server] - error boundary.
 * @param error неизвестное исключение
 * @param event H3Event (для логирования)
 * @return { ApiResponse<never> }
 */
export function handleApiError(error: unknown, event?: H3Event): ApiResponse<never> {
  const message: string = error instanceof Error ? error.message : String(error)

  if (event) {
    console.error(`[API error] ${event.path}: ${message}`, error)
  } else {
    console.error(`[API error] ${message}`, error)
  }

  const code: ApiErrorCode = inferErrorCode(error)

  return errorResponse(createApiError(code, message))
}

/**
 * Вывести HTTP-статус для error response.
 * @description [Server] - http status mapping.
 * @param code код ошибки
 * @return { number } HTTP статус
 */
export function httpStatusForError(code: ApiErrorCode): number {
  switch (code) {
    case 'session_not_found':
    case 'session_expired':
      return 404
    case 'validation_error':
    case 'action_not_found':
      return 400
    case 'insufficient_resources':
      return 422
    case 'command_id_conflict':
    case 'state_version_conflict':
      return 409
    case 'persistence_unavailable':
      return 503
    case 'network_error':
      return 503
    case 'internal_error':
    default:
      return 500
  }
}

function inferErrorCode(error: unknown): ApiErrorCode {
  if (!(error instanceof Error)) return 'internal_error'

  const message: string = error.message.toLowerCase()

  if (error.name === 'CommandIdConflictError') return 'command_id_conflict'
  if (error.name === 'StateVersionConflictError') return 'state_version_conflict'
  if (error.name === 'PersistenceError') return 'persistence_unavailable'

  if (message.includes('session') && message.includes('not found')) return 'session_not_found'

  if (message.includes('session') && message.includes('expired')) return 'session_expired'

  if (message.includes('validation') || message.includes('invalid')) return 'validation_error'

  if (message.includes('action') && message.includes('not found')) return 'action_not_found'

  if (message.includes('insufficient') || message.includes('not enough')) return 'insufficient_resources'

  if (message.includes('network') || message.includes('fetch')) return 'network_error'

  return 'internal_error'
}
