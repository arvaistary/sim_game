import { gameQueries } from '@/domain/game-facade/queries'
import { ECSWorld } from '@/domain/ecs/world'
import type { EventQueueComponent, FinanceComponent, InvestmentComponent, WalletComponent } from '@/domain/ecs/types'

export const appGameQueries = {
  getCareerTrack(world: ECSWorld): Array<Record<string, unknown>> {
    return gameQueries.getCareerTrack(world)
  },
  getActivityLogEntries(world: ECSWorld, count = 8): Array<Record<string, unknown>> {
    return gameQueries.getActivityLogEntries(world, count)
  },
  canStartEducationProgram(world: ECSWorld, programId: string): boolean {
    return gameQueries.canStartEducationProgram(world, programId)
  },
  getFinanceOverview(world: ECSWorld) {
    return gameQueries.getFinanceOverview(world)
  },
  getInvestments(world: ECSWorld) {
    return gameQueries.getInvestments(world)
  },
  canExecuteAction(world: ECSWorld, actionId: string): { canExecute: boolean; reason?: string } {
    return gameQueries.canExecuteAction(world, actionId)
  },
  peekScheduledEvent(world: ECSWorld): Record<string, unknown> | null {
    return gameQueries.getNextEvent(world)
  },
  getActivityLog(world: ECSWorld, filter?: string, limit?: number) {
    return gameQueries.getActivityLog(world, filter, limit)
  },
  getActivityTimelineWindow(world: ECSWorld, count: number, beforeIndex?: number) {
    return gameQueries.getActivityLogWindow(world, count, beforeIndex)
  },
  getEventQueue(world: ECSWorld, playerId: string): EventQueueComponent['queue'] {
    const component = world.getComponent<EventQueueComponent>(playerId, 'eventQueue')
    return component?.queue ?? []
  },
  getFinanceSnapshot(world: ECSWorld, playerId: string) {
    const wallet = world.getComponent<WalletComponent>(playerId, 'wallet')
    const finance = world.getComponent<FinanceComponent>(playerId, 'finance')
    const investments = world.getComponent<InvestmentComponent>(playerId, 'investment')
    return {
      money: wallet?.money ?? 0,
      reserveFund: wallet?.reserveFund ?? 0,
      monthlyIncome: wallet?.monthlyIncome ?? 0,
      monthlyExpenses: (finance as unknown as { monthlyExpenses?: Record<string, number> } | null)?.monthlyExpenses ?? {},
      emergencyFund: finance?.emergencyFund ?? 0,
      deposits: finance?.deposits ?? [],
      portfolios: investments?.portfolios ?? [],
    }
  },
}
