/**
 * Лёгкий telemetry-модуль для отслеживания инвариантов и аномалий.
 * 
 * Счётчики:
 * - action_fail:* — причины отказов действий
 * - event_dedup_hit — дубликаты событий
 * - skill_shape_fallback — чтение skill в старом формате (number вместо {level, xp})
 * - time_advance_anomaly — аномальные сдвиги времени (<=0 или >168ч за один вызов)
 * - work_shift — отработанная смена (count)
 * - work_salary_payout — выплаченная зарплата (сумма в delta)
 * - work_pending_salary — начислено в pending (сумма в delta)
 * - work_dismissal_underwork — увольнение за недоработку (count)
 * - work_week_rollover — rollover недели (count)
 * - career_promotion — авто-повышение (count)
 * - career_demotion — понижение при ручной смене (count)
 * - career_change — успешная ручная смена должности (count)
 * - life_memory_recorded — записано воспоминание (count)
 * - life_memory_deactivated — деактивировано воспоминание (count)
 * - life_memory_trimmed — отброшено записей при trim (count / delta)
 * - life_memory_childhood_score — пересчёт childhoodScore (count, +1 за каждый пересчёт)
 * - personality_axis_change:{axis} — изменение оси Big Five (явный modifyAxis)
 * - personality_trait_unlocked:{traitId} — разблокирована черта
 * - personality_drift_applied — применён дрейф осей за тик update
 * - tag_add:{tagId} — добавлен тег
 * - tag_remove:{tagId} — снят тег
 * - tag_expire:{tagId} — истёк тег по времени
 * - tag_stack:{tagId} — увеличен стак stackable-тега
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
