/**
 * Async-варианты executor-интерфейсов (server-first migration, Stage 1).
 *
 * В SPA-режиме async executor оборачивает sync GameExecutor в Promise.resolve().
 * В server-mode — вызывает Nitro API через $fetch.
 *
 * Миграция store на async-интерфейсы идёт постепенно (Stage 3),
 * sync GameExecutor/GameQueryExecutor остаются для backwards compat.
 */
import type { ActivityEntry, GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type {
  CanStartEducationResult,
  CommandOutcome,
  ExecuteActionCommandResult,
  FinanceOverviewDto,
  FinanceSnapshotDto,
} from './index.types'
import type { Investment } from '@/domain/balance/constants/default-save'

/**
 * Availability check результат.
 */
export interface AvailabilityCheck {
  canExecute: boolean
  reason?: string
}

/**
 * Окно activity timeline для пагинации.
 */
export interface ActivityLogWindow {
  entries: ActivityEntry[]
  hasMore: boolean
  nextCursor?: number
}

export interface InitStateOptions {
  saveData?: GameWorldJSON
  replace?: boolean
}

/**
 * Элемент очереди событий для UI.
 */
export interface EventQueueItemDto {
  id: string
  title: string
  choices?: Array<{ id: string; text: string; outcome?: string }>
}

/**
 * Career track элемент (catalog-agnostic).
 */
export interface CareerTrackItemDto {
  id: string
  name: string
  level: number
  schedule: string
  salaryPerHour: number
}

/**
 * Async GameExecutor для server-first миграции.
 *
 * `world` параметр обязателен для всех методов, мутирующих/читающих мир:
 * SPA async executor передаёт реальный GameWorld, ServerExecutor игнорирует
 * (сессия на сервере) — но сигнатура одинакова. Это упрощает factory и
 * устраняет `world?` опциональность, которая вела к runtime-проверкам.
 */
export interface AsyncGameExecutor {
  resetStateVersion?: () => void
  executeLifestyleAction(world: GameWorld | null, cardData: Record<string, unknown>): Promise<string>
  simulateWorkShift(world: GameWorld | null, hours: number): Promise<string>
  changeCareer(world: GameWorld | null, jobId: string): Promise<CommandOutcome>
  quitCareer(world: GameWorld | null): Promise<CommandOutcome>
  startEducationProgram(world: GameWorld | null, programId: string): Promise<string>
  advanceEducation(world: GameWorld | null): Promise<string>
  executeFinanceDecision(world: GameWorld | null, actionId: string): Promise<string>
  executeAction(world: GameWorld | null, actionId: string): Promise<ExecuteActionCommandResult>
  resolveEventDecision(world: GameWorld | null, eventId: string, choiceId: string): Promise<CommandOutcome>
  collectInvestment(world: GameWorld | null, investmentId: string): Promise<string>
  advanceTime(world: GameWorld | null, hours: number): Promise<void>
  applyMonthlySettlement(world: GameWorld | null): Promise<string>
}

/**
 * Async GameQueryExecutor для server-first миграции.
 */
export interface AsyncGameQueryExecutor {
  getState(world: GameWorld | null): Promise<GameWorldJSON>
  initState(world: GameWorld | null, options?: InitStateOptions): Promise<GameWorldJSON>
  getCareerTrack(world: GameWorld | null): Promise<CareerTrackItemDto[]>
  getActivityLogEntries(world: GameWorld | null, count?: number): Promise<ActivityEntry[]>
  canStartEducationProgram(world: GameWorld | null, programId: string): Promise<boolean>
  canStartEducationProgramWithReason(world: GameWorld | null, programId: string): Promise<CanStartEducationResult>
  getFinanceOverview(world: GameWorld | null): Promise<FinanceOverviewDto>
  getFinanceSnapshot(world: GameWorld | null): Promise<FinanceSnapshotDto>
  getInvestments(world: GameWorld | null): Promise<Investment[]>
  canExecuteAction(world: GameWorld | null, actionId: string): Promise<AvailabilityCheck>
  peekScheduledEvent(world: GameWorld | null): Promise<EventQueueItemDto | null>
  getActivityLog(world: GameWorld | null, filter?: string, limit?: number): Promise<ActivityEntry[]>
  getActivityTimelineWindow(world: GameWorld | null, count: number): Promise<ActivityLogWindow>
  getEventQueue(world: GameWorld | null): Promise<GameEventPayload[]>
}
