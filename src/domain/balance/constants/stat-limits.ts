import type { StatKey } from '@/domain/balance/types'
import type { StatLimit } from './stat-limits.types'

/** Минимум отображаемой шкалы для нефатальных характеристик. */
export const NON_CRITICAL_DISPLAY_MIN: number = -150

const STAT_LIMITS: Record<StatKey, StatLimit> = {
  // hunger/stress инвертируются в UI: raw 250 соответствует отображаемому -150.
  hunger: { min: 0, max: 250 },
  energy: { min: 0, max: 100 },
  stress: { min: 0, max: 250 },
  mood: { min: NON_CRITICAL_DISPLAY_MIN, max: 100 },
  health: { min: 0, max: 100 },
  physical: { min: NON_CRITICAL_DISPLAY_MIN, max: 100 },
}

/**
 * Ограничить значение с учётом направления шкалы.
 * @description [Domain] - сохраняет для инвертированных шкал запас до критического дефицита.
 * @return { number } значение в допустимом диапазоне
 */
export function clampStatValue(key: StatKey, value: number): number {
  const limit: StatLimit = STAT_LIMITS[key]
  return Math.max(limit.min, Math.min(limit.max, value))
}
