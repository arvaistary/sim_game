/**
 * SPAExecutor (ADR-0005, Фаза 4).
 *
 * Реализация GameExecutor и GameQueryExecutor для SPA-режима.
 * Отвечает за создание/синхронизацию GameWorld из Pinia stores:
 *   1. snapshot = snapshotProvider()
 *   2. world = fromStores(snapshot)
 *   3. pure command (world, ...)
 *   4. applyToStores(world, loadTarget)
 *
 * После удаления bridge (Фаза 5) world будет жить в gameStore постоянно,
 * а stores станут computed-projections над ним.
 */
import type { GameWorld } from '@/domain/game-world/GameWorld'
import { fromStores, applyToStores } from '@/domain/game-world/bridge'
import type {
  CommandOutcome,
  ExecuteActionCommandResult,
  GameExecutor,
  GameQueryExecutor,
  LoadTarget,
  SnapshotProvider,
} from './index.types'
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
import {
  executeLifestyleAction,
  simulateWorkShift,
  changeCareer,
  quitCareer,
  executeAction,
  resolveEventDecision,
  collectInvestment,
  advanceTime,
  applyMonthlySettlement,
  executeFinanceDecision,
} from './commands'

/**
 * Фабрика snapshot'ов (для чтения состояния из Pinia).
 * В реальном SPA: () => gameStore.save() as unknown as StoresSnapshot.
 */
// тип вынесен в ./index.types.ts (правило typing/types-location).

/**
 * Цель для записи изменений (Pinia stores с load()).
 */
// тип вынесен в ./index.types.ts (правило typing/types-location).

/**
 * Создать GameWorld из snapshot-provider.
 * @description [Application] - SPA-only фабрика мира.
 * @return { GameWorld }
 */
function buildWorld(snapshotProvider: SnapshotProvider): GameWorld {
  return fromStores(snapshotProvider())
}

/**
 * Записать изменения мира в loadTarget.
 * @description [Application] - SPA-only sync.
 * @return { void }
 */
function commitWorld(world: GameWorld, loadTarget: LoadTarget): void {
  applyToStores(world, loadTarget)
}
/**
 * Создать SPA-executor над snapshot-provider + load-target.
 *
 * @description [Application] - фабрика executor-а для SPA-режима. Snapshot
 * читается через snapshotProvider (например, gameStore.save()), запись идёт
 * через loadTarget (stores с load()). После удаления bridge (Фаза 5)
 * snapshotProvider/loadTarget заменяются на прямую ссылку на GameWorld.
 *
 * @param snapshotProvider возвращает текущий snapshot всех stores
 * @param loadTarget целевые stores с load() для синхронизации изменений
 * @return { { execute: GameExecutor; query: GameQueryExecutor } }
 */
export function createSPAExecutor(
  snapshotProvider: SnapshotProvider,
  loadTarget: LoadTarget,
): {
  execute: GameExecutor
  query: GameQueryExecutor
} {
  const execute: GameExecutor = {
    executeLifestyleAction(cardData: Record<string, unknown>): string {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: string = executeLifestyleAction(world, cardData)
      commitWorld(world, loadTarget)
      return result
    },

    simulateWorkShift(_world: GameWorld, hours: number): string {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: string = simulateWorkShift(world, hours)
      commitWorld(world, loadTarget)
      return result
    },

    changeCareer(_world: GameWorld, jobId: string): CommandOutcome {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: CommandOutcome = changeCareer(world, jobId)
      commitWorld(world, loadTarget)
      return result
    },

    quitCareer(_world: GameWorld): CommandOutcome {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: CommandOutcome = quitCareer(world)
      commitWorld(world, loadTarget)
      return result
    },

    startEducationProgram(programId: string): string {
      return programId
    },

    advanceEducation(): string {
      return 'ok'
    },

    executeFinanceDecision(actionId: string): string {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: string = executeFinanceDecision(world, actionId)
      commitWorld(world, loadTarget)
      return result
    },

    executeAction(_world: GameWorld, actionId: string): ExecuteActionCommandResult {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: ExecuteActionCommandResult = executeAction(world, actionId)
      commitWorld(world, loadTarget)
      return result
    },

    resolveEventDecision(_world: GameWorld, _eventId: string, choiceId: string): CommandOutcome {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: CommandOutcome = resolveEventDecision(world, _eventId, null, choiceId)
      commitWorld(world, loadTarget)
      return result
    },

    collectInvestment(_world: GameWorld, investmentId: string): string {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: string = collectInvestment(world, investmentId)
      commitWorld(world, loadTarget)
      return result
    },

    advanceTime(_world: GameWorld, hours: number): void {
      const world: GameWorld = buildWorld(snapshotProvider)
      advanceTime(world, hours)
      commitWorld(world, loadTarget)
    },

    applyMonthlySettlement(_world: GameWorld): string {
      const world: GameWorld = buildWorld(snapshotProvider)
      const result: string = applyMonthlySettlement(world)
      commitWorld(world, loadTarget)
      return result
    },
  }

  const query: GameQueryExecutor = {
    getCareerTrack(): Array<Record<string, unknown>> {
      return getCareerTrackQuery(buildWorld(snapshotProvider))
    },

    getActivityLogEntries(count: number): Array<Record<string, unknown>> {
      return getActivityLogEntriesQuery(buildWorld(snapshotProvider), count) as unknown as Array<Record<string, unknown>>
    },

    canStartEducationProgram(): boolean {
      return false
    },

    canStartEducationProgramWithReason(): { ok: boolean; reason?: string } {
      return { ok: false, reason: 'Not implemented in SPAExecutor' }
    },

    getFinanceOverview() {
      return getFinanceOverviewQuery(buildWorld(snapshotProvider))
    },

    getFinanceActions(): never[] {
      return []
    },

    getInvestments() {
      return getInvestmentsQuery(buildWorld(snapshotProvider))
    },

    canExecuteAction(actionId: string): { canExecute: boolean; reason?: string } {
      return canExecuteActionQuery(buildWorld(snapshotProvider), actionId)
    },

    peekScheduledEvent(): Record<string, unknown> | null {
      return peekScheduledEventQuery(buildWorld(snapshotProvider)) as unknown as Record<string, unknown> | null
    },

    getActivityLog(filter?: string, limit?: number) {
      return getActivityLogQuery(buildWorld(snapshotProvider), filter, limit)
    },

    getActivityTimelineWindow(count: number) {
      return getActivityTimelineWindowQuery(buildWorld(snapshotProvider), count)
    },

    getEventQueue() {
      return getEventQueueQuery(buildWorld(snapshotProvider))
    },

    getFinanceSnapshot() {
      return getFinanceSnapshotQuery(buildWorld(snapshotProvider))
    },
  }

  return { execute, query }
}
