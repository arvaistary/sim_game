/**
 * Client-side unified error handler (server-first migration, Stage 5.4).
 *
 * Парсит ошибки API и сетевые ошибки, классифицирует и предоставляет
 * человекочитаемые сообщения для toast-уведомлений.
 */
import type { ApiErrorCode } from '@game-life/contracts'
import type { NuxtLikeError, ParsedApiError } from './server-sync.types'

const NETWORK_ERROR_PATTERNS: string[] = [
  'failed to fetch',
  'networkerror',
  'network request failed',
  'err_connection',
  'load failed',
  'timeout',
]

const VALIDATION_CODES: ApiErrorCode[] = ['validation_error', 'action_not_found']

const SESSION_CODES: ApiErrorCode[] = ['session_not_found', 'session_expired']

const RETRYABLE_CODES: ApiErrorCode[] = ['network_error', 'internal_error']

const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  session_not_found: 'Сессия истекла. Начните новую игру.',
  session_expired: 'Сессия истекла. Перезагрузите страницу.',
  validation_error: 'Некорректные данные запроса.',
  action_not_found: 'Действие не найдено.',
  insufficient_resources: 'Недостаточно ресурсов.',
  internal_error: 'Внутренняя ошибка сервера. Попробуйте позже.',
  network_error: 'Ошибка сети. Проверьте подключение.',
  command_id_conflict: 'Command id already used with different payload.',
  state_version_conflict: 'State changed on server. Refresh and retry.',
  persistence_unavailable: 'Game persistence is temporarily unavailable.',
}

/**
 * Распарсить ошибку в ParsedApiError.
 * @description [Application] - client-side error parser.
 * @param error неизвестная ошибка
 * @return { ParsedApiError }
 */
export function parseApiError(error: unknown): ParsedApiError {
  const message: string = extractMessage(error)
  const code: ApiErrorCode = inferCode(message, error)
  const isNetwork: boolean = isNetworkError(error)

  return {
    code,
    message: DEFAULT_MESSAGES[code] ?? message,
    isNetwork,
    isValidation: VALIDATION_CODES.includes(code),
    isSession: SESSION_CODES.includes(code),
    retryable: isNetwork || RETRYABLE_CODES.includes(code),
  }
}

/**
 * Проверить, является ли ошибка сетевой.
 * @description [Application] - network error check.
 * @param error неизвестная ошибка
 * @return { boolean }
 */
export function isNetworkError(error: unknown): boolean {
  const message: string = extractMessage(error).toLowerCase()

  return NETWORK_ERROR_PATTERNS.some((pattern: string) => message.includes(pattern))
}

/**
 * Проверить, является ли ошибка ошибкой валидации.
 * @description [Application] - validation error check.
 * @param error неизвестная ошибка
 * @return { boolean }
 */
export function isValidationError(error: unknown): boolean {
  const parsed: ParsedApiError = parseApiError(error)

  return parsed.isValidation
}

/**
 * Проверить, относится ли ошибка к сессии (истекла/не найдена).
 * @description [Application] - session error check.
 * @param error неизвестная ошибка
 * @return { boolean }
 */
export function isSessionError(error: unknown): boolean {
  const parsed: ParsedApiError = parseApiError(error)

  return parsed.isSession
}

function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (typeof error === 'string') return error

  if (error !== null && typeof error === 'object') {
    const obj: NuxtLikeError = error as NuxtLikeError
    const msg: unknown = obj.message ?? obj.statusMessage

    if (typeof msg === 'string') return msg
  }

  return String(error ?? '')
}

function inferCode(message: string, error: unknown): ApiErrorCode {
  const lower: string = message.toLowerCase()
  const statusCode: number | undefined = extractStatusCode(error)

  if (statusCode === 404 && lower.includes('session')) return 'session_not_found'

  if (statusCode === 400) return 'validation_error'

  if (statusCode === 422) return 'insufficient_resources'

  if (statusCode === 404) return 'action_not_found'

  if (statusCode === 500) return 'internal_error'

  if (statusCode === 503) return 'network_error'

  if (NETWORK_ERROR_PATTERNS.some((p: string) => lower.includes(p))) return 'network_error'

  if (lower.includes('session') && lower.includes('not found')) return 'session_not_found'

  if (lower.includes('session') && lower.includes('expired')) return 'session_expired'

  if (lower.includes('validation') || lower.includes('invalid')) return 'validation_error'

  if (lower.includes('action') && lower.includes('not found')) return 'action_not_found'

  if (lower.includes('insufficient') || lower.includes('not enough')) return 'insufficient_resources'

  return 'internal_error'
}

function extractStatusCode(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object') return undefined

  const candidate: unknown = (error as { statusCode?: unknown }).statusCode

  return typeof candidate === 'number' ? candidate : undefined
}
