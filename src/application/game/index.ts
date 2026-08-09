export {
  executeLifestyleAction,
  simulateWorkShift,
  changeCareer,
  quitCareer,
  executeAction,
  planDay,
  resolveEventDecision,
  collectInvestment,
  advanceTime,
  applyMonthlySettlement,
  executeFinanceDecision,
  findJobCatalogEntry,
  findProgramCatalogEntry,
} from './commands'
export {
  getCareerTrack,
  getActivityLog,
  getActivityLogEntries,
  getActivityTimelineWindow,
  getFinanceOverview,
  getInvestments,
  canExecuteAction,
  peekScheduledEvent,
  getEventQueue,
  getFinanceSnapshot,
} from './queries'
export { createSPAExecutor } from './SPAExecutor'
export { createSPAAsyncExecutor, createSPAAsyncQueryExecutor } from './spa-async-executor'
export { createServerExecutor } from './server-executor'
export { createServerQueryExecutor } from './server-query-executor'
export {
  createExecutor,
  createQueryExecutor,
} from './executor-factory'
export type { ServerExecutorOptions, ServerQueryExecutorOptions } from './executor-factory'
export {
  loadWorldFromServer,
  syncWorldWithServer,
  initServerWorld,
  checkConflict,
} from './state-sync'
export type { StateSyncResult, ConflictInfo, ParsedApiError, NuxtLikeError } from './server-sync.types'
export {
  parseApiError,
  isNetworkError,
  isValidationError,
  isSessionError,
} from './error-handler'
export { OfflineQueueManager } from './offline-queue'
export type {
  QueuedAction,
  QueuedActionType,
  SyncOutcome,
  OfflineQueueStorage,
  ServerSyncClient,
} from './offline-queue.types'
export type { SnapshotProvider, LoadTarget } from './index.types'
export type {
  AsyncGameExecutor,
  AsyncGameQueryExecutor,
  AvailabilityCheck,
  ActivityLogWindow,
  CareerTrackItemDto,
  EventQueueItemDto,
} from './async-executor.types'
export type { DayPlanInput, DayPlanResult, DayPlanStepResult } from '@/domain/game-world/commands/commands.types'
export { appGameCommands, appGameQueries } from './legacy'
export type { SaveRepository } from './ports/SaveRepository.types'
export type * from './index.types'
