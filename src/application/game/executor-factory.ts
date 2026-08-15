/**
 * Executor factory (server-first migration, Stage 2 + Stage 5).
 *
 * Выбирает нужный executor по game-mode:
 * - 'spa': SPA async executor (sync под капотом, Promise.resolve)
 * - 'server': Server executor (реальные $fetch вызовы к Nitro API)
 * - 'hybrid': SPA fallback (Stage 5.6 добавит server-first логику)
 *
 * Зависимости: factory НЕ импортирует infrastructure (архитектурное правило).
 * Mode передаётся параметром. Store/infrastructure читает runtimeConfig
 * и передаёт сюда.
 */
import type { GameMode } from '@/domain/game-mode'
import type {
  AsyncGameExecutor,
  AsyncGameQueryExecutor,
} from './async-executor.types'
import { createSPAAsyncExecutor, createSPAAsyncQueryExecutor } from './spa-async-executor'
import { createServerExecutor } from './server-executor'
import { createServerQueryExecutor } from './server-query-executor'
import type { ServerExecutorOptions, ServerQueryExecutorOptions } from './server-executor.types'

export type { ServerExecutorOptions, ServerQueryExecutorOptions }

/**
 * Создать async executor для указанного game-mode.
 * @description [Application] - factory по game-mode.
 * @param mode режим игры (передаётся caller-ом из runtimeConfig)
 * @param serverOptions опции для server-mode (baseUrl)
 * @return { AsyncGameExecutor }
 */
export function createExecutor(
  mode: GameMode,
  serverOptions: ServerExecutorOptions = { baseUrl: '' },
): AsyncGameExecutor {
  if (mode === 'server') return createServerExecutor(serverOptions)
  // 'spa' и 'hybrid' используют SPA fallback до Stage 5.6
  return createSPAAsyncExecutor(serverOptions.dayEndHooks)
}

/**
 * Создать async query executor для указанного game-mode.
 * @description [Application] - factory по game-mode.
 * @param mode режим игры
 * @param serverOptions опции для server-mode (baseUrl)
 * @return { AsyncGameQueryExecutor }
 */
export function createQueryExecutor(
  mode: GameMode,
  serverOptions: ServerQueryExecutorOptions = { baseUrl: '' },
): AsyncGameQueryExecutor {
  if (mode === 'server') return createServerQueryExecutor(serverOptions)
  return createSPAAsyncQueryExecutor()
}
