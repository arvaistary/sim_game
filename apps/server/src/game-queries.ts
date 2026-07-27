import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import type { StandaloneFinanceOverview, StandaloneInvestments } from './game-queries.types'

/**
 * @description Return current career item as API projection.
 * @return { Array<Record<string, unknown>> } Career projection.
 */
export function getCareerTrack(world: GameWorld): Array<Record<string, unknown>> {
  const job: typeof world.career.currentJob = world.career.currentJob
  return job.employed ? [job as unknown as Record<string, unknown>] : []
}

/**
 * @description Return finance summary as API projection.
 * @return { StandaloneFinanceOverview } Finance projection.
 */
export function getFinanceOverview(world: GameWorld): StandaloneFinanceOverview {
  return {
    balance: world.wallet.money,
    expenses: 0,
    income: world.wallet.totalEarnings,
  }
}

/**
 * @description Return investments from current game aggregate.
 * @return { StandaloneInvestments } Investment projections.
 */
export function getInvestments(world: GameWorld): StandaloneInvestments {
  return world.finance.investments
}

/**
 * @description Return filtered activity entries from current game aggregate.
 * @return { ActivityEntry[] } Filtered activity entries.
 */
export function getActivityLog(world: GameWorld, filter?: string, limit?: number): ActivityEntry[] {
  let entries: ActivityEntry[] = world.activity.entries

  if (filter && filter !== 'all') {
    entries = entries.filter((entry: ActivityEntry) => entry.type === filter)
  }

  return limit ? entries.slice(-limit) : entries
}
