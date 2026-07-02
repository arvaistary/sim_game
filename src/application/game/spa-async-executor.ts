/**
 * SPA async wrapper (server-first migration, Stage 2).
 *
 * Адаптер sync pure functions в AsyncGameExecutor/AsyncGameQueryExecutor.
 * Оборачивает sync-вызовы в Promise.resolve(). Используется executor-factory
 * в 'spa' режиме и как fallback в 'hybrid' режиме.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type {
  AsyncGameExecutor,
  AsyncGameQueryExecutor,
  ActivityLogWindow,
  AvailabilityCheck,
  CareerTrackItemDto,
  EventQueueItemDto,
} from './async-executor.types'
import type { CanStartEducationResult, CommandOutcome, ExecuteActionCommandResult } from './index.types'
import {
  simulateWorkShift,
  changeCareer,
  quitCareer,
  executeAction,
  resolveEventDecision,
  collectInvestment,
  advanceTime,
  applyMonthlySettlement,
  executeFinanceDecision,
  executeLifestyleAction,
} from './commands'
import {
  canExecuteAction as canExecuteActionQuery,
  getActivityLog as getActivityLogQuery,
  getActivityLogEntries as getActivityLogEntriesQuery,
  getActivityTimelineWindow as getActivityTimelineWindowQuery,
  getCareerTrack as getCareerTrackQuery,
  getEventQueue as getEventQueueQuery,
  getFinanceOverview as getFinanceOverviewQuery,
  getFinanceSnapshot as getFinanceSnapshotQuery,
  getInvestments as getInvestmentsQuery,
  peekScheduledEvent as peekScheduledEventQuery,
} from './queries'

/**
 * Создать async SPA-executor, исполняющий команды над world напрямую.
 * @description [Application] - SPA-mode async adapter.
 * @return { AsyncGameExecutor }
 */
export function createSPAAsyncExecutor(): AsyncGameExecutor {
  const reject = (world: GameWorld | null): Promise<never> => {
    const error: Error = world
      ? new Error('Unexpected error')
      : new Error('world required for SPA executor')
    return Promise.reject(error)
  }

  return {
    executeLifestyleAction(world: GameWorld | null, cardData: Record<string, unknown>): Promise<string> {
      if (!world) return reject(world)
      return Promise.resolve(executeLifestyleAction(world, cardData))
    },

    simulateWorkShift(world: GameWorld | null, hours: number): Promise<string> {
      if (!world) return reject(world)
      return Promise.resolve(simulateWorkShift(world, hours))
    },

    changeCareer(world: GameWorld | null, jobId: string): Promise<CommandOutcome> {
      if (!world) return reject(world)
      return Promise.resolve(changeCareer(world, jobId))
    },

    quitCareer(world: GameWorld | null): Promise<CommandOutcome> {
      if (!world) return reject(world)
      return Promise.resolve(quitCareer(world))
    },

    startEducationProgram(_world: GameWorld | null, _programId: string): Promise<string> {
      return Promise.resolve('ok')
    },

    advanceEducation(_world: GameWorld | null): Promise<string> {
      return Promise.resolve('ok')
    },

    executeFinanceDecision(world: GameWorld | null, actionId: string): Promise<string> {
      if (!world) return reject(world)
      return Promise.resolve(executeFinanceDecision(world, actionId))
    },

    executeAction(world: GameWorld | null, actionId: string): Promise<ExecuteActionCommandResult> {
      if (!world) return reject(world)
      return Promise.resolve(executeAction(world, actionId))
    },

    resolveEventDecision(world: GameWorld | null, eventId: string, choiceId: string): Promise<CommandOutcome> {
      if (!world) return reject(world)
      return Promise.resolve(resolveEventDecision(world, eventId, null, choiceId))
    },

    collectInvestment(world: GameWorld | null, investmentId: string): Promise<string> {
      if (!world) return reject(world)
      return Promise.resolve(collectInvestment(world, investmentId))
    },

    advanceTime(world: GameWorld | null, hours: number): Promise<void> {
      if (!world) return reject(world)
      advanceTime(world, hours)
      return Promise.resolve()
    },

    applyMonthlySettlement(world: GameWorld | null): Promise<string> {
      if (!world) return reject(world)
      return Promise.resolve(applyMonthlySettlement(world))
    },
  }
}

/**
 * Создать async SPA-query-executor.
 * @description [Application] - SPA-mode async query adapter.
 * @return { AsyncGameQueryExecutor }
 */
export function createSPAAsyncQueryExecutor(): AsyncGameQueryExecutor {
  const requireWorld = (world: GameWorld | null): GameWorld => {
    const w: GameWorld | null = world

    if (!w) throw new Error('world required for SPA query executor')

    return w
  }

  return {
    getCareerTrack(world: GameWorld | null): Promise<CareerTrackItemDto[]> {
      const w: GameWorld = requireWorld(world)
      const track: Array<Record<string, unknown>> = getCareerTrackQuery(w)
      const mapped: CareerTrackItemDto[] = track.map(
        (item: Record<string, unknown>) => ({
          id: String(item.id ?? ''),
          name: String(item.name ?? ''),
          level: Number(item.level ?? 0),
          schedule: String(item.schedule ?? ''),
          salaryPerHour: Number(item.salaryPerHour ?? 0),
        }),
      )
      return Promise.resolve(mapped)
    },

    getActivityLogEntries(world: GameWorld | null, count?: number) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getActivityLogEntriesQuery(w, count))
    },

    canStartEducationProgram(_world: GameWorld | null, _programId: string): Promise<boolean> {
      return Promise.resolve(false)
    },

    canStartEducationProgramWithReason(_world: GameWorld | null, _programId: string): Promise<CanStartEducationResult> {
      return Promise.resolve({ ok: false, reason: 'Not implemented in SPA async' })
    },

    getFinanceOverview(world: GameWorld | null) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getFinanceOverviewQuery(w))
    },

    getFinanceSnapshot(world: GameWorld | null) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getFinanceSnapshotQuery(w))
    },

    getInvestments(world: GameWorld | null) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getInvestmentsQuery(w))
    },

    canExecuteAction(world: GameWorld | null, actionId: string): Promise<AvailabilityCheck> {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(canExecuteActionQuery(w, actionId))
    },

    peekScheduledEvent(world: GameWorld | null): Promise<EventQueueItemDto | null> {
      const w: GameWorld = requireWorld(world)
      const event: GameEventPayload | null = peekScheduledEventQuery(w)

      if (!event) return Promise.resolve(null)
      const dto: EventQueueItemDto = {
        id: String(event.id ?? ''),
        title: String(event.title ?? ''),
      }
      return Promise.resolve(dto)
    },

    getActivityLog(world: GameWorld | null, filter?: string, limit?: number) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getActivityLogQuery(w, filter, limit))
    },

    getActivityTimelineWindow(world: GameWorld | null, count: number): Promise<ActivityLogWindow> {
      const w: GameWorld = requireWorld(world)
      const entries: ActivityEntry[] = getActivityTimelineWindowQuery(w, count)
      return Promise.resolve({ entries, hasMore: false })
    },

    getEventQueue(world: GameWorld | null) {
      const w: GameWorld = requireWorld(world)
      return Promise.resolve(getEventQueueQuery(w))
    },
  }
}
