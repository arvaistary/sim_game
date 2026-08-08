import type { DayEndHooks } from '@/domain/game-world/commands'

/**
 * Типы для ServerExecutor (server-first migration, Stage 5).
 *
 * Вынесены из server-executor.ts/server-query-executor.ts по правилу
 * typing/types-location.
 */

/**
 * Опции ServerExecutor.
 */
export interface ServerExecutorOptions {
  /** Базовый URL API (пустая строка = тот же origin). */
  baseUrl: string
  /** Hooks, вызываемые после успешного фактического закрытия дня server executor-ом. */
  dayEndHooks?: DayEndHooks
}

/**
 * Опции ServerQueryExecutor.
 */
export interface ServerQueryExecutorOptions {
  baseUrl: string
}

export const DEFAULT_SERVER_EXECUTOR_OPTIONS: ServerExecutorOptions = {
  baseUrl: '',
}

export const DEFAULT_SERVER_QUERY_EXECUTOR_OPTIONS: ServerQueryExecutorOptions = {
  baseUrl: '',
}
