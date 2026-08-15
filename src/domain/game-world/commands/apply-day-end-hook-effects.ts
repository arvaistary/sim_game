import type { GameWorld } from '@/domain/game-world/GameWorld'
import { BALANCE_CONSTANTS } from '@/domain/balance/utils/hourly-rates'
import { applyWorldSnapshotSlices } from '@/domain/game-world/apply-world-slices'
import type { DayEndHookEffectsPayload } from './apply-day-end-hook-effects.types'

/**
 * Применить эффекты day-end hooks к миру (server authoritative persist).
 * @description [Domain] - заменяет срезы events/wallet/finance/career после client-side hooks.
 * @return { void }
 */
export function applyDayEndHookEffects(world: GameWorld, payload: DayEndHookEffectsPayload): void {
  const currentDay: number = Math.floor(world.time.totalHours / BALANCE_CONSTANTS.HOURS_PER_DAY)

  if (payload.dayNumber !== currentDay) {
    throw new Error(`Day number mismatch: expected ${currentDay}, got ${payload.dayNumber}`)
  }

  applyWorldSnapshotSlices(world, {
    events: payload.events,
    wallet: payload.wallet,
    finance: payload.finance,
    career: payload.career,
  })
}
