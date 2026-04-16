/**
 * Лёгкий telemetry-модуль для отслеживания инвариантов и аномалий.
 * 
 * Счётчики:
 * - action_fail:* — причины отказов действий
 * - event_dedup_hit — дубликаты событий
 * - skill_shape_fallback — чтение skill в старом формате (number вместо {level, xp})
 * - time_advance_anomaly — аномальные сдвиги времени (<=0 или >168ч за один вызов)
 */

type TelemetryCounter = Record<string, number>

const counters: TelemetryCounter = {}

/** Инкремент счётчика. */
export function telemetryInc(key: string, delta = 1): void {
  counters[key] = (counters[key] ?? 0) + delta
}

/** Получить все счётчики (копия). */
export function telemetryGetCounters(): Readonly<TelemetryCounter> {
  return { ...counters }
}

/** Сбросить все счётчики. */
export function telemetryReset(): void {
  for (const key of Object.keys(counters)) {
    delete counters[key]
  }
}

/** Отчёт в консоль (dev-mode helper). */
export function telemetryReport(): void {
  if (Object.keys(counters).length === 0) {
    // eslint-disable-next-line no-console
    console.log('[telemetry] no events recorded')
    return
  }
  // eslint-disable-next-line no-console
  console.log('[telemetry] report:', JSON.stringify(counters, null, 2))
}
