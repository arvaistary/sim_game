import type { Investment } from '@/domain/balance/constants/default-save'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge'

export interface CanStartEducationResult {
  ok: boolean
  reason?: string
}

/**
 * Фабрика snapshot'ов (для чтения состояния из Pinia).
 * В реальном SPA: () => gameStore.save() as unknown as StoresSnapshot.
 */
export type SnapshotProvider = () => StoresSnapshot

/**
 * Цель для записи изменений (Pinia stores с load()).
 */
export type LoadTarget = StoresLoadTarget

export interface EventChoiceInput {
  eventId: string
  choiceId: string
}

export interface ExecuteActionCommandResult {
  success: boolean
  message: string
}

export interface JobCatalogEntry {
  name: string
  salaryPerHour: number
  requiredHoursPerWeek: number
}

export interface ProgramCatalogEntry {
  name: string
  duration: number
  cost: number
}

export interface ActionRequirements {
  minAge?: number
  minSkills?: Record<string, number>
}

export interface FinanceSnapshotDto {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: Record<string, number>
  emergencyFund: number
  deposits: Investment[]
  portfolios: Investment[]
}

export interface FinanceOverviewDto {
  balance: number
  expenses: number
  income: number
}

/** Результат команды executor-а (sync вариант для SPA). */
export interface CommandOutcome {
  success: boolean
  message: string
}

/**
 * GameExecutor — интерфейс для выполнения команд над игровым миром.
 *
 * SPAExecutor (Фаза 4) поставляет `world` из Pinia game-store.
 * ServerExecutor (server-first миграция) — из сессии по sessionId.
 * Сигнатура `executeX(world, ...)` гарантирует, что application layer чистый
 * (не импортирует Pinia напрямую).
 */
export interface GameExecutor {
  executeLifestyleAction(cardData: Record<string, unknown>): string
  simulateWorkShift(world: GameWorld, hours: number): string
  changeCareer(world: GameWorld, jobId: string): CommandOutcome
  quitCareer(world: GameWorld): CommandOutcome
  startEducationProgram(programId: string): string
  advanceEducation(): string
  executeFinanceDecision(actionId: string): string
  executeAction(world: GameWorld, actionId: string): ExecuteActionCommandResult
  resolveEventDecision(world: GameWorld, eventId: string, choiceId: string): CommandOutcome
  collectInvestment(world: GameWorld, investmentId: string): string
  advanceTime(world: GameWorld, hours: number): void
  applyMonthlySettlement(world: GameWorld): string
}

/**
 * GameQueryExecutor — интерфейс для read-only queries над миром.
 *
 * Queries НЕ мутируют состояние. В SPA читают из Pinia stores (projections),
 * в server mode — из world напрямую.
 */
export interface GameQueryExecutor {
  getCareerTrack(): Array<Record<string, unknown>>
  getActivityLogEntries(count?: number): Array<Record<string, unknown>>
  canStartEducationProgram(programId: string): boolean
  canStartEducationProgramWithReason(programId: string): CanStartEducationResult
  getFinanceOverview(): FinanceOverviewDto
  getFinanceActions(): never[]
  getInvestments(): Investment[]
  canExecuteAction(actionId: string): { canExecute: boolean; reason?: string }
  peekScheduledEvent(): Record<string, unknown> | null
  getActivityLog(filter?: string, limit?: number): ActivityEntry[]
  getActivityTimelineWindow(count: number): ActivityEntry[]
  getEventQueue(): GameEventPayload[]
  getFinanceSnapshot(): FinanceSnapshotDto
}
