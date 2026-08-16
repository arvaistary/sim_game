/**
 * ServerExecutor (server-first migration, Stage 5).
 *
 * Реальная реализация AsyncGameExecutor через Nitro API. Загружает/сохраняет
 * состояние через сессионные endpoints. `world` параметр игнорируется —
 * сервер сам управляет состоянием в сессии.
 *
 * Использует Nuxt $fetch (universal). Endpoints соответствуют server/api/game/**.
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { DayPlanInput, DayPlanResult, DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
import { getAllActions, type BalanceAction } from '@/domain/balance/actions'
import type { EducationProgram } from '@/domain/balance/types'
import { createNoopDayEndHooks, planDayCommand } from '@/domain/game-world/commands'
import type { DayEndHooks } from '@/domain/game-world/commands'
import type {
  AsyncGameExecutor,
} from './async-executor.types'
import type {
  ActionExecuteResponse,
  ApiResponse,
  GameStateResponse as ContractGameStateResponse,
  SyncResponse,
} from '@game-life/contracts'
import type { CommandOutcome, ExecuteActionCommandResult } from './index.types'
import type { ServerExecutorOptions } from './server-executor.types'
import { DEFAULT_SERVER_EXECUTOR_OPTIONS } from './server-executor.types'
import { EDUCATION_PROGRAMS } from '@/domain/balance/constants/education-programs'

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
  const dayEndHooks: DayEndHooks = options.dayEndHooks ?? createNoopDayEndHooks()
  let stateVersion: number | undefined

  async function sendCommand<T extends { stateVersion?: number }>(
    url: string,
    requestOptions?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> },
    allowSyncFailures: boolean = false,
  ): Promise<T> {
    const body: Record<string, unknown> = { ...(requestOptions?.body ?? {}) }

    if (Array.isArray(body.actions)) {
      body.actions = (body.actions as Array<Record<string, unknown>>).map((action) => ({
        ...action,
        commandId: action.commandId ?? crypto.randomUUID(),
        ...(stateVersion === undefined ? {} : { expectedStateVersion: stateVersion }),
      }))
    } else {
      body.commandId = body.commandId ?? crypto.randomUUID()

      if (stateVersion !== undefined) body.expectedStateVersion = stateVersion
    }
    let data: T

    try {
      data = await fetchApi<T>(url, { ...requestOptions, body }, allowSyncFailures)
    } catch {
      data = await fetchApi<T>(url, { ...requestOptions, body }, allowSyncFailures)
    }

    if (data.stateVersion !== undefined) stateVersion = data.stateVersion
    return data
  }

  return {
    resetStateVersion(): void {
      stateVersion = undefined
    },

    async executeAction(_world: GameWorld | null, actionId: string): Promise<ExecuteActionCommandResult> {
      const data: ActionExecuteResponse = await sendCommand<ActionExecuteResponse>(
        `${base}/api/game/actions/execute`,
        {
          method: 'POST',
          body: { actionId },
        },
      )
      return data.result
    },

    async planDay(_world: GameWorld | null, plan: DayPlanInput): Promise<DayPlanResult> {
      const beforeResponse: ContractGameStateResponse<GameWorldJSON> = await fetchApi<ContractGameStateResponse<GameWorldJSON>>(`${base}/api/game/state`)
      const before: GameWorld = GameWorld.fromJSON(beforeResponse.state)
      const validation: DayPlanResult = planDayCommand(GameWorld.fromJSON(before.toJSON()), plan)

      if (!validation.success) return validation

      const sleepAction: BalanceAction | undefined = getAllActions().find(
        (action: BalanceAction) => action.actionType === 'sleep' && action.hourCost === plan.sleepHours,
      )
      const commands: Array<{ kind: 'sleep' | 'work' | 'action'; actionId?: string; hours: number }> = [
        ...(plan.sleepHours > 0 ? [{ kind: 'sleep' as const, actionId: sleepAction?.id, hours: plan.sleepHours }] : []),
        ...(plan.workHours && plan.workHours > 0 ? [{ kind: 'work' as const, hours: plan.workHours }] : []),
        ...plan.actionIds.map((actionId: string) => ({ kind: 'action' as const, actionId, hours: getAllActions().find((action: BalanceAction) => action.id === actionId)?.hourCost ?? 0 })),
      ]
      let working: GameWorld = before
      const steps: DayPlanStepResult[] = []
      let moneyDelta: number = 0
      const statChanges: Record<string, number> = {}
      const startTotalHours: number = before.time.totalHours

      for (const command of commands) {
        const response: SyncResponse<GameWorldJSON> = await sendCommand<SyncResponse<GameWorldJSON>>(`${base}/api/game/sync`, {
          method: 'POST',
          body: {
            actions: [{
              type: command.kind === 'work' ? 'work' : 'action',
              payload: command.kind === 'work' ? { hours: command.hours } : { actionId: command.actionId },
              timestamp: Date.now(),
            }],
          },
        }, true)
        const next: GameWorld = GameWorld.fromJSON(response.state)
        const success: boolean = response.failed === 0

        if (success) {
          for (const key of ['hunger', 'energy', 'stress', 'mood', 'health', 'physical'] as const) {
            const delta: number = next.stats[key] - working.stats[key]

            if (delta !== 0) statChanges[key] = (statChanges[key] ?? 0) + delta
          }
          moneyDelta += next.wallet.money - working.wallet.money
        }
        working = next
        steps.push({ kind: command.kind, actionId: command.actionId, success, message: success ? 'Выполнено' : (response.errors?.[0]?.message ?? 'Шаг пропущен'), hoursSpent: success ? command.hours : 0 })
      }

      const dayEndHours: number = startTotalHours + (startTotalHours % 24 === 0 && startTotalHours > 0 ? 24 : before.time.dayHoursRemaining)
      const remainingIdleHours: number = Math.max(0, dayEndHours - working.time.totalHours)
      let idleHours: number = 0

      if (remainingIdleHours > 0) {
        const response: SyncResponse<GameWorldJSON> = await sendCommand<SyncResponse<GameWorldJSON>>(`${base}/api/game/sync`, {
          method: 'POST',
          body: { actions: [{ type: 'time', payload: { hours: remainingIdleHours }, timestamp: Date.now() }] },
        }, true)
        const success: boolean = response.failed === 0
        working = GameWorld.fromJSON(response.state)
        idleHours = success ? remainingIdleHours : 0
        steps.push({ kind: 'idle', success, message: success ? 'Остаток дня прошёл спокойно' : (response.errors?.[0]?.message ?? 'Остаток дня не прошёл'), hoursSpent: idleHours })
      }

      const didCloseDay: boolean = working.time.totalHours === dayEndHours
      const endDay: number = Math.floor(working.time.totalHours / 24)
      const crossedWeekBoundary: boolean = Math.floor(endDay / 7) !== Math.floor(startTotalHours / 24 / 7)
      const crossedMonthBoundary: boolean = Math.floor(endDay / 30) !== Math.floor(startTotalHours / 24 / 30)
      const crossedYearBoundary: boolean = Math.floor(endDay / 365) !== Math.floor(startTotalHours / 24 / 365)
      const ageChanged: boolean = working.player.currentAge !== before.player.currentAge
      const result: DayPlanResult = {
        success: didCloseDay,
        message: didCloseDay ? 'День завершён' : 'Не удалось закрыть день',
        steps,
        statChanges,
        moneyDelta,
        plannedHours: validation.plannedHours,
        idleHours,
        totalHoursSpent: working.time.totalHours - startTotalHours,
        dayNumber: endDay,
        crossedWeekBoundary,
        crossedMonthBoundary,
        crossedYearBoundary,
        ageChanged,
      }

      if (didCloseDay) {
        dayEndHooks.onDayEnd(working, result)

        if (crossedWeekBoundary) dayEndHooks.onWeekEnd(working)

        if (crossedMonthBoundary) dayEndHooks.onMonthEnd(working)

        if (crossedYearBoundary) dayEndHooks.onYearEnd(working)

        if (ageChanged) {
          dayEndHooks.onAgeChanged(working, {
            previousAge: before.player.currentAge,
            currentAge: working.player.currentAge,
          })
        }

        const hookSnapshot: GameWorldSnapshot = working.toSnapshot()
        const hooksResponse: SyncResponse<GameWorldJSON> = await sendCommand<SyncResponse<GameWorldJSON>>(
          `${base}/api/game/sync`,
          {
            method: 'POST',
            body: {
              actions: [{
                commandId: `day_end_hooks_${endDay}`,
                type: 'day_end_hooks',
                payload: {
                  dayNumber: endDay,
                  events: hookSnapshot.events,
                  wallet: hookSnapshot.wallet,
                  finance: hookSnapshot.finance,
                  career: hookSnapshot.career,
                },
                timestamp: Date.now(),
              }],
            },
          },
        )
        working = GameWorld.fromJSON(hooksResponse.state)
      }

      return result
    },

    async simulateWorkShift(_world: GameWorld | null, hours: number): Promise<string> {
      await sendCommand<SyncResponse>(
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
      await sendCommand<SyncResponse>(
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
      await sendCommand<SyncResponse>(
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
      const response: SyncResponse = await sendCommand<SyncResponse>(
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
      throwIfSyncFailed(response)

      const program: EducationProgram | undefined = EDUCATION_PROGRAMS.find(
        (candidate: EducationProgram) => candidate.id === programId,
      )
      return `Программа ${program?.title ?? programId} начата`
    },

    async advanceEducation(_world: GameWorld | null): Promise<string> {
      const response: SyncResponse = await sendCommand<SyncResponse>(
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
      throwIfSyncFailed(response)

      return 'Обучение продвинуто'
    },

    async executeFinanceDecision(_world: GameWorld | null, actionId: string): Promise<string> {
      await sendCommand<SyncResponse>(
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
      await sendCommand<SyncResponse>(
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
      await sendCommand<SyncResponse>(
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
      await sendCommand<SyncResponse>(`${base}/api/game/sync`, {
        method: 'POST',
        body: {
          actions: [
            { type: 'action', payload: { actionId: 'advance_time', hours }, timestamp: Date.now() },
          ],
        },
      })
    },

    async applyMonthlySettlement(_world: GameWorld | null): Promise<string> {
      await sendCommand<SyncResponse>(
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
function throwIfSyncFailed(response: SyncResponse): void {
  if (response.failed === 0) return

  throw new Error(response.errors?.[0]?.message ?? 'Команда не выполнена')
}

async function fetchApi<T>(url: string, options?: { method?: 'GET' | 'POST'; body?: Record<string, unknown> }, allowSyncFailures: boolean = false): Promise<T> {
  const response: ApiResponse<T> = await $fetch<ApiResponse<T>>(url, {
    ...options,
    credentials: 'include',
  })

  if (!response.success || response.data === undefined) {
    const message: string = response.error?.message ?? 'API request failed'
    const apiError: Error & { code?: string; details?: Record<string, unknown> } = new Error(message) as Error & { code?: string; details?: Record<string, unknown> }
    apiError.code = response.error?.code
    apiError.details = response.error?.details
    throw apiError
  }

  const syncData: T & { failed?: number; errors?: Array<{ message: string }> } = response.data as T & { failed?: number; errors?: Array<{ message: string }> }

  if (!allowSyncFailures && syncData.failed && syncData.failed > 0) {
    throw new Error(syncData.errors?.[0]?.message ?? 'Command rejected by server')
  }

  return syncData
}
