/**
 * Конфигурация режимов игры (server-first migration, Stage 1).
 *
 * Источник режима — nuxt.config.ts runtimeConfig.public.gameMode.
 * Хелперы ниже — тонкие обёртки для читаемости в consumer-коде.
 *
 * Важно: НЕ путать с `import.meta.server` (это среда выполнения Nuxt:
 * server-render vs client-render), а не режим game-mode.
 */
import type { GameMode, GameModeConfig, OnlineStatus } from '@/domain/game-mode'
import { DEFAULT_GAME_MODE } from '@/domain/game-mode'

export type { GameMode, GameModeConfig, OnlineStatus, SyncStatus } from '@/domain/game-mode'
export { DEFAULT_GAME_MODE, DEFAULT_GAME_MODE_CONFIG } from '@/domain/game-mode'

/**
 * Текущий game-mode из runtimeConfig.public.gameMode.
 * @description [Infrastructure] - чтение Nuxt runtime config на клиенте.
 * @return { GameMode }
 */
export function getGameMode(): GameMode {
  const config = useRuntimeConfig()
  const mode: GameMode | undefined = config.public.gameMode as GameMode | undefined
  return mode ?? DEFAULT_GAME_MODE
}

/**
 * Полная конфигурация режима.
 * @description [Infrastructure] - чтение Nuxt runtime config.
 * @return { GameModeConfig }
 */
export function getGameModeConfig(): GameModeConfig {
  const config = useRuntimeConfig()
  const mode: GameMode = (config.public.gameMode as GameMode | undefined) ?? DEFAULT_GAME_MODE
  const offlineQueueEnabled: boolean = (config.public.gameOfflineQueue as boolean | undefined) ?? true
  const apiBaseUrl: string = (config.public.gameApiBaseUrl as string | undefined) ?? ''

  return { mode, offlineQueueEnabled, apiBaseUrl }
}

/**
 * SPA режим (локальное исполнение).
 * @description [Infrastructure] - хелпер режима.
 * @return { boolean }
 */
export function isSPAMode(): boolean {
  return getGameMode() === 'spa'
}

/**
 * Server режим (через Nitro API).
 * @description [Infrastructure] - хелпер режима.
 * @return { boolean }
 */
export function isServerMode(): boolean {
  return getGameMode() === 'server'
}

/**
 * Hybrid режим (server с offline fallback).
 * @description [Infrastructure] - хелпер режима.
 * @return { boolean }
 */
export function isHybridMode(): boolean {
  return getGameMode() === 'hybrid'
}

/**
 * Поддерживает ли текущий режим offline-очередь.
 * @description [Infrastructure] - хелпер режима.
 * @return { boolean }
 */
export function isOfflineCapable(): boolean {
  return getGameModeConfig().offlineQueueEnabled && (isServerMode() || isHybridMode())
}

/**
 * Статус сети (online/offline) на клиенте.
 * @description [Infrastructure] - browser-only, на сервере возвращает 'unknown'.
 * @return { OnlineStatus }
 */
export function getOnlineStatus(): OnlineStatus {
  if (!import.meta.client) return 'unknown'
  return navigator.onLine ? 'online' : 'offline'
}

/**
 * Подписка на online/offline события браузера.
 * @description [Infrastructure] - browser-only, возвращает функцию отписки.
 * @param onOnline вызывается при восстановлении соединения
 * @param onOffline вызывается при потере соединения
 * @return { () => void } функция отписки
 */
export function subscribeToNetworkChanges(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  if (!import.meta.client) return () => {}

  const handleOnline = (): void => onOnline()
  const handleOffline = (): void => onOffline()

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
