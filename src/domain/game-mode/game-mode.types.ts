/**
 * Типы для game mode конфигурации (server-first migration, Stage 1).
 *
 * Лежат в domain, т.к. это нейтральная бизнес-конфигурация режимов игры,
 * которую могут импортировать и application, и infrastructure (архитектурное
 * правило: оба слоя зависят от domain, но не друг от друга).
 *
 * GameMode определяет, как application layer исполняет команды:
 * - 'spa': локально через SPAExecutor (текущий режим)
 * - 'server': через Nitro API + ServerExecutor
 * - 'hybrid': server при online, fallback на spa при offline
 */
export type GameMode = 'spa' | 'server' | 'hybrid'

/**
 * Статус сети для hybrid/offline логики.
 */
export type OnlineStatus = 'online' | 'offline' | 'unknown'

/**
 * Конфигурация режима, читаемая из runtimeConfig.public.gameMode.
 */
export interface GameModeConfig {
  mode: GameMode
  /** Включить offline queue (только для server/hybrid). */
  offlineQueueEnabled: boolean
  /** URL API для server mode. Пустая строка = тот же origin. */
  apiBaseUrl: string
}

/**
 * Статус синхронизации для UI индикатора.
 */
export type SyncStatus = 'idle' | 'syncing' | 'error'

export const DEFAULT_GAME_MODE: GameMode = 'spa'

export const DEFAULT_GAME_MODE_CONFIG: GameModeConfig = {
  mode: DEFAULT_GAME_MODE,
  offlineQueueEnabled: true,
  apiBaseUrl: '',
}
