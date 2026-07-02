/**
 * Legacy appGameCommands / appGameQueries (ADR-0005, Фаза 4).
 *
 * @deprecated Временный модуль для обратной совместимости во время Фазы 4.
 * Все consumers должны мигрировать на `createSPAExecutor(stores)` или
 * напрямую на чистые функции из `./commands.ts`/`./queries.ts`.
 * Будет удалён в Фазе 5 вместе с bridge.ts.
 *
 * Связывает текущий Pinia gameStore со SPAExecutor. Чистые команды
 * в ./commands.ts не знают про Pinia — этот модуль поставляет stores.
 */
import { useGameStore } from '@/stores/game.store'
import { useEducationStore } from '@/stores/education-store'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import { fromStores } from '@/domain/game-world/bridge'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge.types'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import { createSPAExecutor } from './SPAExecutor'
import {
  canExecuteAction as canExecuteActionPure,
  getActivityLog as getActivityLogPure,
  getActivityLogEntries as getActivityLogEntriesPure,
  getActivityTimelineWindow as getActivityTimelineWindowPure,
  getCareerTrack as getCareerTrackPure,
  getEventQueue as getEventQueuePure,
  getFinanceOverview as getFinanceOverviewPure,
  getFinanceSnapshot as getFinanceSnapshotPure,
  getInvestments as getInvestmentsPure,
  peekScheduledEvent as peekScheduledEventPure,
} from './queries'
import type {
  FinanceOverviewDto,
  FinanceSnapshotDto,
  GameExecutor,
  GameQueryExecutor,
  SnapshotProvider,
} from './index.types'

/**
 * Snapshot-provider: возвращает снимок всех Pinia stores.
 * @description [Application] - legacy helper.
 * @return { StoresSnapshot }
 */
function snapshotProvider(): StoresSnapshot {
  return useGameStore().save() as unknown as StoresSnapshot
}

/**
 * Load-target: Pinia stores с load().
 * @description [Application] - legacy helper.
 * @return { StoresLoadTarget }
 */
function loadTarget(): StoresLoadTarget {
  return useGameStore() as unknown as StoresLoadTarget
}

/**
 * Получить текущий SPA-executor, привязанный к Pinia gameStore.
 * @description [Application] - legacy helper.
 * @return { { execute: GameExecutor; query: GameQueryExecutor } }
 */
function getExecutor(): { execute: GameExecutor; query: GameQueryExecutor } {
  return createSPAExecutor(snapshotProvider as SnapshotProvider, loadTarget())
}

/**
 * Построить GameWorld из текущих Pinia stores (для queries).
 * @description [Application] - legacy helper.
 * @return { GameWorld }
 */
function buildWorldFromStores(): GameWorld {
  return fromStores(snapshotProvider())
}

/**
 * Legacy object для обратной совместимости с consumers, использующими
 * старый API `appGameCommands.method(...)`. Сигнатуры заворачивают world
 * внутри executor-а.
 * @deprecated Использовать createSPAExecutor напрямую.
 */
export const appGameCommands = {
  executeLifestyleAction(cardData: Record<string, unknown>): string {
    return getExecutor().execute.executeLifestyleAction(cardData)
  },

  simulateWorkShift(hours: number): string {
    const { execute } = getExecutor()
    return execute.simulateWorkShift({} as never, hours)
  },

  changeCareer(jobId: string): { success: boolean; message: string } {
    return getExecutor().execute.changeCareer({} as never, jobId)
  },

  quitCareer(): { success: boolean; message: string } {
    return getExecutor().execute.quitCareer({} as never)
  },

  startEducationProgram(programId: string): string {
    return getExecutor().execute.startEducationProgram(programId)
  },

  advanceEducation(): string {
    return getExecutor().execute.advanceEducation()
  },

  executeFinanceDecision(actionId: string): string {
    return getExecutor().execute.executeFinanceDecision(actionId)
  },

  executeAction(actionId: string): { success: boolean; message: string } {
    return getExecutor().execute.executeAction({} as never, actionId)
  },

  resolveEventDecision(eventId: string, choiceId: string): { success: boolean; message: string } {
    return getExecutor().execute.resolveEventDecision({} as never, eventId, choiceId)
  },

  collectInvestment(investmentId: string): string {
    return getExecutor().execute.collectInvestment({} as never, investmentId)
  },

  advanceTime(hours: number): void {
    getExecutor().execute.advanceTime({} as never, hours)
  },

  applyMonthlySettlement(): string {
    return getExecutor().execute.applyMonthlySettlement({} as never)
  },
}

/**
 * Legacy queries для обратной совместимости со старым API `appGameQueries.method(...)`.
 * Делегирует в чистые query-функции, поставляя им world из Pinia.
 * @deprecated Использовать чистые функции из ./queries.ts напрямую.
 */
export const appGameQueries = {
  getCareerTrack(): Array<Record<string, unknown>> {
    return getCareerTrackPure(buildWorldFromStores())
  },

  getActivityLogEntries(count: number = 8): Array<Record<string, unknown>> {
    const entries: ActivityEntry[] = getActivityLogEntriesPure(buildWorldFromStores(), count)
    return entries as unknown as Array<Record<string, unknown>>
  },

  canStartEducationProgram(programId: string): boolean {
    return useEducationStore().canStartProgramById(programId)
  },

  canStartEducationProgramWithReason(programId: string): { ok: boolean; reason?: string } {
    const educationStore = useEducationStore()

    if (!educationStore.canStartProgramById(programId)) {
      return { ok: false, reason: 'Невозможно начать программу' }
    }
    return { ok: true }
  },

  getFinanceOverview(): FinanceOverviewDto {
    return getFinanceOverviewPure(buildWorldFromStores())
  },

  getFinanceActions(): never[] {
    return []
  },

  getInvestments() {
    return getInvestmentsPure(buildWorldFromStores())
  },

  canExecuteAction(actionId: string): { canExecute: boolean; reason?: string } {
    return canExecuteActionPure(buildWorldFromStores(), actionId)
  },

  peekScheduledEvent(): Record<string, unknown> | null {
    return peekScheduledEventPure(buildWorldFromStores()) as unknown as Record<string, unknown> | null
  },

  getActivityLog(filter?: string, limit?: number) {
    return getActivityLogPure(buildWorldFromStores(), filter, limit)
  },

  getActivityTimelineWindow(count: number) {
    return getActivityTimelineWindowPure(buildWorldFromStores(), count)
  },

  getEventQueue() {
    return getEventQueuePure(buildWorldFromStores())
  },

  getFinanceSnapshot(): FinanceSnapshotDto {
    return getFinanceSnapshotPure(buildWorldFromStores())
  },
}
