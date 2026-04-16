import { gameQueries } from '@/domain/game-facade/queries'
import { GameWorld } from '@/domain/engine/world'
import type { EventQueueComponent, FinanceComponent, InvestmentComponent, WalletComponent } from '@/domain/engine/types'

export const appGameQueries = {
  getCareerTrack(world: GameWorld): Array<Record<string, unknown>> {
    return gameQueries.getCareerTrack(world)
  },
  getActivityLogEntries(world: GameWorld, count = 8): Array<Record<string, unknown>> {
    return gameQueries.getActivityLogEntries(world, count)
  },
  canStartEducationProgram(world: GameWorld, programId: string): boolean {
    return gameQueries.canStartEducationProgram(world, programId)
  },
  getFinanceOverview(world: GameWorld) {
    return gameQueries.getFinanceOverview(world)
  },
  getFinanceActions(world: GameWorld) {
    return gameQueries.getFinanceActions(world)
  },
  getInvestments(world: GameWorld) {
    return gameQueries.getInvestments(world)
  },
  canExecuteAction(world: GameWorld, actionId: string): { canExecute: boolean; reason?: string } {
    return gameQueries.canExecuteAction(world, actionId)
  },
  peekScheduledEvent(world: GameWorld): Record<string, unknown> | null {
    return gameQueries.getNextEvent(world)
  },
  getActivityLog(world: GameWorld, filter?: string, limit?: number) {
    return gameQueries.getActivityLog(world, filter, limit)
  },
  getActivityTimelineWindow(world: GameWorld, count: number, beforeIndex?: number) {
    return gameQueries.getActivityLogWindow(world, count, beforeIndex)
  },
  getEventQueue(world: GameWorld, playerId: string): EventQueueComponent['queue'] {
    const component = world.getComponent<EventQueueComponent>(playerId, 'eventQueue')
    return component?.queue ?? []
  },
  getFinanceSnapshot(world: GameWorld, playerId: string) {
    const wallet = world.getComponent<WalletComponent>(playerId, 'wallet')
    const finance = world.getComponent<FinanceComponent>(playerId, 'finance')
    const investments = world.getComponent<InvestmentComponent>(playerId, 'investment')
    return {
      money: wallet?.money ?? 0,
      reserveFund: wallet?.reserveFund ?? 0,
      monthlyIncome: wallet?.monthlyIncome ?? 0,
      monthlyExpenses: (finance as unknown as { monthlyExpenses?: Record<string, number> } | null)?.monthlyExpenses ?? {},
      emergencyFund: 0,
      deposits: [],
      portfolios: investments?.portfolios ?? [],
    }
  },
}
