/**
 * Типы для server-first миграционных модулей (Stage 5).
 *
 * state-sync.ts и error-handler.ts хранят здесь свои интерфейсы по правилу
 * typing/types-location.
 */
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { ApiErrorCode } from '@/domain/api-contract'

export interface StateSyncResult {
  state: GameWorldJSON
  appliedAt: number
}

export interface ConflictInfo {
  hasConflict: boolean
  localTimestamp?: number
  serverTimestamp?: number
  reason?: string
}

export interface ParsedApiError {
  code: ApiErrorCode
  message: string
  isNetwork: boolean
  isValidation: boolean
  isSession: boolean
  retryable: boolean
}

/**
 * Nuxt/H3-like error shape для extractMessage.
 */
export interface NuxtLikeError {
  statusCode?: unknown
  statusMessage?: unknown
  message?: unknown
}
