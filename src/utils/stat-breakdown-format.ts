import type { StatChangeBreakdownEntry } from '@domain/balance/types'
import { METRIC_LABELS } from '@constants/metric-labels'

import type { ActionResultStatLine } from './stat-breakdown-format.types'

function formatSigned(value: number): string {
  const rounded = Math.round(value * 100) / 100

  return `${rounded >= 0 ? '+' : ''}${rounded}`
}

/**
 * Короткое текстовое объяснение вкладов по формуле calculateStatChanges.
 */
export function buildStatBreakdownExplanation(entry: StatChangeBreakdownEntry): string {
  const parts: string[] = []
  if (entry.baseFromAction !== 0) {
    parts.push(`база действия ${formatSigned(entry.baseFromAction)}`)
  }
  const modExtra = entry.valueAfterPerStatModifier - entry.baseFromAction
  if (Math.abs(modExtra) > 0.001) {
    parts.push(`модификаторы ${formatSigned(modExtra)}`)
  }
  if (entry.agingApplied) {
    parts.push(`возраст ×${entry.agingMultiplier.toFixed(2)} к негативу`)
  }
  if (entry.sleepDebtDelta !== 0) {
    parts.push(`долг сна ${formatSigned(entry.sleepDebtDelta)}`)
  }

  return parts.join('; ')
}

/**
 * Строки для модалки: только ненулевые итоговые изменения.
 */
export function buildActionResultStatLines(breakdown: StatChangeBreakdownEntry[]): ActionResultStatLine[] {
  return breakdown
    .filter(e => e.final !== 0)
    .map(e => {
      const label = METRIC_LABELS[e.stat] ?? e.stat
      const text = `${label} ${e.final >= 0 ? '+' : ''}${e.final}`

      return {
        label,
        text,
        explanation: buildStatBreakdownExplanation(e),
      }
    })
}
