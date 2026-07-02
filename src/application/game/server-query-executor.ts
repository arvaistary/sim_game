/**
 * ServerQueryExecutor (server-first migration, Stage 5).
 *
 * Реальная реализация AsyncGameQueryExecutor через Nitro API GET endpoints.
 * `world` параметр игнорируется — сервер читает состояние из сессии.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { Investment } from '@/domain/balance/constants/default-save'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type {
  AsyncGameQueryExecutor,
  ActivityLogWindow,
  AvailabilityCheck,
  CareerTrackItemDto,
  EventQueueItemDto,
} from './async-executor.types'
import type {
  CanStartEducationResult,
  FinanceOverviewDto,
  FinanceSnapshotDto,
} from './index.types'
import type { ServerQueryExecutorOptions } from './server-executor.types'
import { DEFAULT_SERVER_QUERY_EXECUTOR_OPTIONS } from './server-executor.types'

/**
 * Создать ServerQueryExecutor, вызывающий Nitro API.
 * @description [Application] - server-mode query executor.
 * @param options опции (baseUrl)
 * @return { AsyncGameQueryExecutor }
 */
export function createServerQueryExecutor(
  options: ServerQueryExecutorOptions = DEFAULT_SERVER_QUERY_EXECUTOR_OPTIONS,
): AsyncGameQueryExecutor {
  const base: string = options.baseUrl

  return {
    async getCareerTrack(_world: GameWorld | null): Promise<CareerTrackItemDto[]> {
      const data: Array<Record<string, unknown>> = await $fetch<Array<Record<string, unknown>>>(
        `${base}/api/game/career/track`,
      )
      return data.map((item: Record<string, unknown>) => ({
        id: String(item.id ?? ''),
        name: String(item.name ?? ''),
        level: Number(item.level ?? 0),
        schedule: String(item.schedule ?? ''),
        salaryPerHour: Number(item.salaryPerHour ?? 0),
      }))
    },

    async getActivityLogEntries(_world: GameWorld | null, count?: number): Promise<ActivityEntry[]> {
      const url: string = count !== undefined
        ? `${base}/api/game/activity-log?count=${count}`
        : `${base}/api/game/activity-log`
      return $fetch<ActivityEntry[]>(url)
    },

    async canStartEducationProgram(
      _world: GameWorld | null,
      programId: string,
    ): Promise<boolean> {
      // Нет отдельного endpoint; используем WithReason и берём ok
      const result: CanStartEducationResult = await this.canStartEducationProgramWithReason(_world, programId)
      return result.ok
    },

    async canStartEducationProgramWithReason(
      _world: GameWorld | null,
      _programId: string,
    ): Promise<CanStartEducationResult> {
      // Пока endpoint не реализован — возвращаем permissive
      return { ok: true }
    },

    async getFinanceOverview(_world: GameWorld | null): Promise<FinanceOverviewDto> {
      return $fetch<FinanceOverviewDto>(`${base}/api/game/finance/overview`)
    },

    async getFinanceSnapshot(_world: GameWorld | null): Promise<FinanceSnapshotDto> {
      // Пока нет отдельного endpoint — собираем из overview + investments
      const overview: FinanceOverviewDto = await $fetch<FinanceOverviewDto>(
        `${base}/api/game/finance/overview`,
      )
      const investments: Investment[] = await $fetch<Investment[]>(`${base}/api/game/investments`)
      return {
        money: overview.balance,
        reserveFund: 0,
        monthlyIncome: overview.income,
        monthlyExpenses: {},
        emergencyFund: 0,
        deposits: investments.filter((i: Investment) => i.type === 'deposit'),
        portfolios: investments.filter((i: Investment) => i.type === 'stocks'),
      }
    },

    async getInvestments(_world: GameWorld | null): Promise<Investment[]> {
      return $fetch<Investment[]>(`${base}/api/game/investments`)
    },

    async canExecuteAction(_world: GameWorld | null, actionId: string): Promise<AvailabilityCheck> {
      // Нет отдельного endpoint; клиент должен сам валидировать либо расширить API
      void actionId
      return { canExecute: true }
    },

    async peekScheduledEvent(_world: GameWorld | null): Promise<EventQueueItemDto | null> {
      // Нет отдельного endpoint; возвращаем null (нет активного события)
      return null
    },

    async getActivityLog(
      _world: GameWorld | null,
      filter?: string,
      limit?: number,
    ): Promise<ActivityEntry[]> {
      const params: string[] = []

      if (filter) params.push(`filter=${encodeURIComponent(filter)}`)

      if (limit !== undefined) params.push(`limit=${limit}`)

      const query: string = params.length > 0 ? `?${params.join('&')}` : ''
      return $fetch<ActivityEntry[]>(`${base}/api/game/activity-log${query}`)
    },

    async getActivityTimelineWindow(
      _world: GameWorld | null,
      count: number,
    ): Promise<ActivityLogWindow> {
      const entries: ActivityEntry[] = await $fetch<ActivityEntry[]>(
        `${base}/api/game/activity-log?count=${count}`,
      )
      return { entries, hasMore: false }
    },

    async getEventQueue(_world: GameWorld | null): Promise<GameEventPayload[]> {
      // Нет отдельного endpoint; возвращаем пустой массив
      return []
    },
  }
}
