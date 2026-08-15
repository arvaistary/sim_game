import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'

export interface WorldHookEffectSlices {
  events: GameWorldSnapshot['events']
  wallet: GameWorldSnapshot['wallet']
  finance: GameWorldSnapshot['finance']
  career: GameWorldSnapshot['career']
}

/**
 * Применить срезы snapshot к живому миру (events/wallet/finance/career).
 * @description [Domain] - shared path для day_end_hooks и bridge-adjacent sync.
 * @return { void }
 */
export function applyWorldSnapshotSlices(world: GameWorld, slices: WorldHookEffectSlices): void {
  world.events.pending.splice(0, world.events.pending.length, ...slices.events.pending)
  world.events.history.splice(0, world.events.history.length, ...slices.events.history)
  world.events.state.cooldownByEventId = { ...slices.events.state.cooldownByEventId }
  world.events.state.seenEventIds = [...slices.events.state.seenEventIds]
  world.events.state.lastWeeklyEventWeek = slices.events.state.lastWeeklyEventWeek
  world.events.state.lastMonthlyEventMonth = slices.events.state.lastMonthlyEventMonth
  world.events.state.lastYearlyEventYear = slices.events.state.lastYearlyEventYear

  Object.assign(world.wallet, slices.wallet)

  world.finance.reserveFund = slices.finance.reserveFund
  world.finance.monthlyExpenses = { ...slices.finance.monthlyExpenses }
  world.finance.lastMonthlySettlement = slices.finance.lastMonthlySettlement
  world.finance.debt = slices.finance.debt
  world.finance.investments.splice(
    0,
    world.finance.investments.length,
    ...slices.finance.investments.map((investment) => ({ ...investment })),
  )
  world.finance.expenseList.splice(
    0,
    world.finance.expenseList.length,
    ...slices.finance.expenseList.map((expense) => ({ ...expense })),
  )

  Object.assign(world.career.currentJob, slices.career.currentJob)
  world.career.careerLevel = slices.career.careerLevel
  world.career.promotions = slices.career.promotions
  world.career.jobHistory.splice(
    0,
    world.career.jobHistory.length,
    ...slices.career.jobHistory.map((job) => ({ ...job })),
  )
}
