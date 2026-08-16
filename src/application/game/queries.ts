/**
 * Pure application queries (ADR-0005, Фаза 4).
 *
 * Все queries принимают `world: GameWorld` первым аргументом.
 * Application layer НЕ импортирует Pinia — только domain и utils.
 * SPAExecutor (legacy.ts) поставляет stores для совместимости со старым API.
 */
import { getActionAvailabilityBlockReason } from '@/domain/game-world/action-availability'

import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import type { ActivityEntry, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import { getActionById } from '@/domain/balance/actions'
import type { BalanceAction } from '@/domain/balance/actions'
import type { FinanceOverviewDto, FinanceSnapshotDto } from './index.types'

/**
 * Career track из мира (без useCareerStore).
 * @description [Application] - чистая query.
 * @return { Array<Record<string, unknown>> }
 */
export function getCareerTrack(world: GameWorld): Array<Record<string, unknown>> {
  const job: GameWorldSnapshot['career']['currentJob'] = world.career.currentJob

  if (!job.employed) return []
  return [job as unknown as Record<string, unknown>]
}

/**
 * Activity log из мира.
 * @description [Application] - чистая query.
 * @return { ActivityEntry[] }
 */
export function getActivityLog(world: GameWorld, filter?: string, limit?: number): ActivityEntry[] {
  let entries: ActivityEntry[] = world.activity.entries

  if (filter && filter !== 'all') {
    entries = entries.filter((entry: ActivityEntry) => entry.type === filter)
  }

  if (limit) {
    entries = entries.slice(-limit)
  }
  return entries
}

/**
 * Activity log entries (последние N).
 * @description [Application] - чистая query.
 * @return { ActivityEntry[] }
 */
export function getActivityLogEntries(world: GameWorld, count: number = 8): ActivityEntry[] {
  return world.activity.entries.slice(-count)
}

/**
 * Finance overview из мира.
 * @description [Application] - чистая query.
 * @return { FinanceOverviewDto }
 */
export function getFinanceOverview(world: GameWorld): FinanceOverviewDto {
  return {
    balance: world.wallet.money,
    expenses: 0,
    income: world.wallet.totalEarnings,
  }
}

/**
 * Investments из мира.
 * @description [Application] - чистая query.
 * @return { typeof world.finance.investments }
 */
export function getInvestments(world: GameWorld): typeof world.finance.investments {
  return world.finance.investments
}

/**
 * Can execute action check (без мутации).
 * @description [Application] - чистая query.
 * @return { { canExecute: boolean; reason?: string } }
 */
export function canExecuteAction(world: GameWorld, actionId: string): { canExecute: boolean; reason?: string } {
  const action: BalanceAction | null = getActionById(actionId)

  if (!action) return { canExecute: false, reason: 'Действие не найдено' }

  if (world.wallet.money < action.price) return { canExecute: false, reason: 'Недостаточно денег' }

  if (world.time.dayHoursRemaining < action.hourCost) return { canExecute: false, reason: 'Недостаточно времени на сегодня' }

  if (world.time.weekHoursRemaining < action.hourCost) return { canExecute: false, reason: 'Недостаточно времени' }

  const availabilityBlockReason: string | null = getActionAvailabilityBlockReason(world, action, actionId)

  if (availabilityBlockReason) return { canExecute: false, reason: availabilityBlockReason }

  return { canExecute: true }
}

/**
 * Peek scheduled event (следующее в очереди).
 * @description [Application] - чистая query.
 * @return { GameEventPayload | null }
 */
export function peekScheduledEvent(world: GameWorld): GameEventPayload | null {
  const next: unknown = world.events.pending[0]
  return (next as GameEventPayload) ?? null
}

/**
 * Event queue из мира.
 * @description [Application] - чистая query.
 * @return { GameEventPayload[] }
 */
export function getEventQueue(world: GameWorld): GameEventPayload[] {
  return world.events.pending as unknown as GameEventPayload[]
}

/**
 * Finance snapshot из мира (DTO).
 * @description [Application] - чистая query.
 * @return { FinanceSnapshotDto }
 */
export function getFinanceSnapshot(world: GameWorld): FinanceSnapshotDto {
  return {
    money: world.wallet.money,
    reserveFund: world.wallet.reserveFund,
    monthlyIncome: world.wallet.totalEarnings,
    monthlyExpenses: world.finance.monthlyExpenses,
    emergencyFund: world.wallet.reserveFund,
    deposits: [],
    portfolios: world.finance.investments,
  }
}

/**
 * Activity timeline window (последние N с sorting).
 * @description [Application] - чистая query.
 * @return { ActivityEntry[] }
 */
export function getActivityTimelineWindow(world: GameWorld, count: number): ActivityEntry[] {
  return world.activity.entries.slice(-count)
}
