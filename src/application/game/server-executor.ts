/**
 * ServerExecutor (server-first migration, Stage 5).
 *
 * Реальная реализация AsyncGameExecutor через Nitro API. Загружает/сохраняет
 * состояние через сессионные endpoints. `world` параметр игнорируется —
 * сервер сам управляет состоянием в сессии.
 *
 * Использует Nuxt $fetch (universal). Endpoints соответствуют server/api/game/**.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type {
  AsyncGameExecutor,
} from './async-executor.types'
import type {
  ActionExecuteResponse,
  ApiResponse,
  SyncResponse,
} from '@game-life/contracts'
import type { CommandOutcome, ExecuteActionCommandResult } from './index.types'
import type { ServerExecutorOptions } from './server-executor.types'
import { DEFAULT_SERVER_EXECUTOR_OPTIONS } from './server-executor.types'

/**
 * Создать ServerExecutor, вызывающий Nitro API.
 * @description [Application] - server-mode executor.
 * @param options опции (baseUrl)
 * @return { AsyncGameExecutor }
 */
export function createServerExecutor(
  options: ServerExecutorOptions = DEFAULT_SERVER_EXECUTOR_OPTIONS,
): AsyncGameExecutor {
  const base: string = options.baseUrl

  return {
    async executeAction(_world: GameWorld | null, actionId: string): Promise<ExecuteActionCommandResult> {
      const data: ActionExecuteResponse = await fetchApi<ActionExecuteResponse>(
        `${base}/api/game/actions/execute`,
        {
          method: 'POST',
          body: { actionId },
        },
      )
      return data.result
    },

    async simulateWorkShift(_world: GameWorld | null, hours: number): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'work', payload: { hours }, timestamp: Date.now() },
            ],
          },
        },
      )

      return 'Смена отработана'
    },

    async changeCareer(_world: GameWorld | null, jobId: string): Promise<CommandOutcome> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'career', payload: { jobId, action: 'change' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return { success: true, message: `Устроились на ${jobId}` }
    },

    async quitCareer(_world: GameWorld | null): Promise<CommandOutcome> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'career', payload: { action: 'quit' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return { success: true, message: 'Уволились' }
    },

    async startEducationProgram(_world: GameWorld | null, programId: string): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'education', payload: { programId, action: 'start' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return `Программа ${programId} начата`
    },

    async advanceEducation(_world: GameWorld | null): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'education', payload: { action: 'advance' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return 'Обучение продвинуто'
    },

    async executeFinanceDecision(_world: GameWorld | null, actionId: string): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'finance', payload: { actionId }, timestamp: Date.now() },
            ],
          },
        },
      )

      return `Финансовое действие ${actionId} выполнено`
    },

    async executeLifestyleAction(
      _world: GameWorld | null,
      cardData: Record<string, unknown>,
    ): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'action', payload: cardData, timestamp: Date.now() },
            ],
          },
        },
      )

      return 'Действие выполнено'
    },

    async resolveEventDecision(
      _world: GameWorld | null,
      eventId: string,
      choiceId: string,
    ): Promise<CommandOutcome> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'event', payload: { eventId, choiceId }, timestamp: Date.now() },
            ],
          },
        },
      )

      return { success: true, message: 'Событие применено' }
    },

    async collectInvestment(_world: GameWorld | null, investmentId: string): Promise<string> {
      await fetchApi<{ state: unknown }>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'finance', payload: { investmentId, action: 'collect' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return `Инвестиция ${investmentId} закрыта`
    },

    async advanceTime(_world: GameWorld | null, hours: number): Promise<void> {
      await fetchApi<SyncResponse>(`${base}/api/game/sync`, {
        method: 'POST',
        body: {
          actions: [
            { type: 'action', payload: { actionId: 'advance_time', hours }, timestamp: Date.now() },
          ],
        },
      })
    },

    async applyMonthlySettlement(_world: GameWorld | null): Promise<string> {
      await fetchApi<SyncResponse>(
        `${base}/api/game/sync`,
        {
          method: 'POST',
          body: {
            actions: [
              { type: 'finance', payload: { action: 'monthly_settlement' }, timestamp: Date.now() },
            ],
          },
        },
      )

      return 'Месячный расчёт применён'
    },
  }
}

/**
 * Распаковать ApiResponse: бросает при success=false, возвращает data.
 * @description [Application] - server-mode helper.
 * @param response API response envelope
 * @return { T } data
 */
async function fetchApi<T>(url: string, options?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> }): Promise<T> {
  const response: ApiResponse<T> = await $fetch<ApiResponse<T>>(url, {
    ...options,
    credentials: 'include',
  })

  if (!response.success || response.data === undefined) {
    const message: string = response.error?.message ?? 'API request failed'
    throw new Error(message)
  }

  const syncData: T & { failed?: number; errors?: Array<{ message: string }> } = response.data as T & { failed?: number; errors?: Array<{ message: string }> }

  if (syncData.failed && syncData.failed > 0) {
    throw new Error(syncData.errors?.[0]?.message ?? 'Command rejected by server')
  }

  return syncData
}
