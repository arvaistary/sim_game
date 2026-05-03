import type { StatChanges } from '@domain/balance/types'
import { STAT_LABELS_RU, STAT_KEY_ORDER } from '@constants/metric-labels'

function formatStatLine(key: string, value: number): string {
  const label = STAT_LABELS_RU[key] ?? key

  return `${label} ${value > 0 ? '+' : ''}${value}`
}

function collectStatParts(statChanges: StatChanges = {}): [string, number][] {
  const parts: [string, number][] = []
  const seen: boolean = new Set<string>()
  for (const key of STAT_KEY_ORDER) {
    const value = statChanges[key]

    if (value === undefined || value === 0) continue
    parts.push([key, value])
    seen.add(key)
  }
  for (const [key, value] of Object.entries(statChanges)) {
    if (seen.has(key) || value === undefined || value === 0) continue
    parts.push([key, value])
  }

  return parts
}

export function summarizeStatChangesRu(statChanges: StatChanges = {}): string {
  return collectStatParts(statChanges)
    .map(([key, value]) => formatStatLine(key, value))
    .join(' • ')
}

export function formatStatChangesBulletListRu(statChanges: StatChanges = {}): string {
  return collectStatParts(statChanges)
    .map(([key, value]) => `• ${formatStatLine(key, value)}`)
    .join('\n')
}
