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
} from '@/domain/api-contract'
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
      const response: ApiResponse<ActionExecuteResponse> = await $fetch<ApiResponse<ActionExecuteResponse>>(
        `${base}/api/game/actions/execute`,
        {
          method: 'POST',
          body: { actionId },
        },
      )
      const data: ActionExecuteResponse = unwrapResponse(response)
      return data.result
    },

    async simulateWorkShift(_world: GameWorld | null, hours: number): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Work shift failed'
        throw new Error(message)
      }
      return 'Смена отработана'
    },

    async changeCareer(_world: GameWorld | null, jobId: string): Promise<CommandOutcome> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Change career failed'
        return { success: false, message }
      }
      return { success: true, message: `Устроились на ${jobId}` }
    },

    async quitCareer(_world: GameWorld | null): Promise<CommandOutcome> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Quit career failed'
        return { success: false, message }
      }
      return { success: true, message: 'Уволились' }
    },

    async startEducationProgram(_world: GameWorld | null, programId: string): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Start education failed'
        throw new Error(message)
      }
      return `Программа ${programId} начата`
    },

    async advanceEducation(_world: GameWorld | null): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Advance education failed'
        throw new Error(message)
      }
      return 'Обучение продвинуто'
    },

    async executeFinanceDecision(_world: GameWorld | null, actionId: string): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Finance decision failed'
        throw new Error(message)
      }
      return `Финансовое действие ${actionId} выполнено`
    },

    async executeLifestyleAction(
      _world: GameWorld | null,
      cardData: Record<string, unknown>,
    ): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Lifestyle action failed'
        throw new Error(message)
      }
      return 'Действие выполнено'
    },

    async resolveEventDecision(
      _world: GameWorld | null,
      eventId: string,
      choiceId: string,
    ): Promise<CommandOutcome> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Resolve event failed'
        return { success: false, message }
      }
      return { success: true, message: 'Событие применено' }
    },

    async collectInvestment(_world: GameWorld | null, investmentId: string): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Collect investment failed'
        throw new Error(message)
      }
      return `Инвестиция ${investmentId} закрыта`
    },

    async advanceTime(_world: GameWorld | null, hours: number): Promise<void> {
      await $fetch<ApiResponse<{ state: unknown }>>(`${base}/api/game/sync`, {
        method: 'POST',
        body: {
          actions: [
            { type: 'action', payload: { actionId: 'advance_time', hours }, timestamp: Date.now() },
          ],
        },
      })
    },

    async applyMonthlySettlement(_world: GameWorld | null): Promise<string> {
      const response: ApiResponse<{ state: unknown }> = await $fetch<ApiResponse<{ state: unknown }>>(
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

      if (!response.success) {
        const message: string = response.error?.message ?? 'Monthly settlement failed'
        throw new Error(message)
      }
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
function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === undefined) {
    const message: string = response.error?.message ?? 'API request failed'
    throw new Error(message)
  }
  return response.data
}
