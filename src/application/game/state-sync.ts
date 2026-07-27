/**
 * State synchronization client-side (server-first migration, Stage 5.3).
 *
 * Утилиты для загрузки/мержа состояния с сервера. Используются useGameStore
 * в server/hybrid режимах. Применяют bridge для обратной записи в Pinia stores.
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { StoresLoadTarget } from '@/domain/game-world/bridge.types'
import { applyToStores } from '@/domain/game-world/bridge'
import type { ApiResponse, GameStateResponse as ContractGameStateResponse } from '@game-life/contracts'
import type { ConflictInfo, StateSyncResult } from './server-sync.types'

/**
 * Загрузить состояние мира с сервера.
 * @description [Application] - server-mode loader.
 * @param baseUrl базовый URL
 * @return { Promise<GameWorldJSON> } состояние мира
 */
export async function loadWorldFromServer(baseUrl: string = ''): Promise<GameWorldJSON> {
  const response: ApiResponse<ContractGameStateResponse<GameWorldJSON>> = await $fetch<ApiResponse<ContractGameStateResponse<GameWorldJSON>>>(
    `${baseUrl}/api/game/state`,
  )

  if (!response.success || !response.data) {
    const message: string = response.error?.message ?? 'Failed to load state'
    throw new Error(message)
  }

  return response.data.state
}

/**
 * Синхронизировать локальные Pinia stores с серверным состоянием.
 * @description [Application] - server-mode sync.
 * @param baseUrl базовый URL
 * @param stores целевые stores для записи
 * @return { Promise<StateSyncResult> } результат синхронизации
 */
export async function syncWorldWithServer(
  baseUrl: string,
  stores: StoresLoadTarget,
): Promise<StateSyncResult> {
  const json: GameWorldJSON = await loadWorldFromServer(baseUrl)
  const world: GameWorld = GameWorld.fromJSON(json)
  applyToStores(world, stores)

  return {
    state: json,
    appliedAt: Date.now(),
  }
}

/**
 * Сравнить локальное и серверное состояние на конфликты.
 * @description [Application] - conflict detection.
 * @param localState локальное состояние
 * @param serverState серверное состояние
 * @return { ConflictInfo } информация о конфликте
 */
export function checkConflict(
  localState: GameWorldJSON,
  serverState: GameWorldJSON,
): ConflictInfo {
  // Простая эвристика: сравниваем totalHours (proxy для timestamp игры)
  const localHours: number = localState.time.totalHours
  const serverHours: number = serverState.time.totalHours

  if (localHours === serverHours) {
    return { hasConflict: false }
  }

  // Если локальное "впереди" сервера — потенциальный конфликт (off-line игра)
  return localHours > serverHours
    ? {
        hasConflict: true,
        reason: `Local is ahead (${localHours} > ${serverHours} hours)`,
      }
    : { hasConflict: false }
}

/**
 * Принудительно инициализировать сессию на сервере (создать новый мир).
 * @description [Application] - server-mode init.
 * @param baseUrl базовый URL
 * @return { Promise<GameWorldJSON> } начальное состояние
 */
export async function initServerWorld(baseUrl: string = ''): Promise<GameWorldJSON> {
  const response: ApiResponse<ContractGameStateResponse<GameWorldJSON>> = await $fetch<ApiResponse<ContractGameStateResponse<GameWorldJSON>>>(
    `${baseUrl}/api/game/init`,
    {
      method: 'POST',
      body: {},
    },
  )

  if (!response.success || !response.data) {
    const message: string = response.error?.message ?? 'Failed to init world'
    throw new Error(message)
  }

  return response.data.state
}
