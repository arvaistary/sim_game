import { ACTION_ID_ALIASES, ACTION_ID_PATTERN } from '@domain/balance/constants/activity-log'
import { getActionById } from '@domain/balance/actions/index'
import { getSkillByKey } from '@domain/balance/constants/skills-constants'
import { METRIC_LABELS } from '@constants/metric-labels'
import type { BalanceAction } from '@domain/balance/actions/types'
import type { ActionMetadata, ActivityLogEntry } from '@domain/balance/types/activity-log'
import type { SkillDef } from '@domain/balance/types'

function normalizeActionId(actionId: unknown): string | null {
  if (typeof actionId !== 'string' || actionId.length === 0) return null

  const normalized: string = actionId.trim().toLowerCase()

  return ACTION_ID_ALIASES[normalized] || normalized
}

function extractActionIdFromTitle(title: string): string | null {
  if (typeof title !== 'string' || title.length === 0) return null

  const trimmed: string = title.trim()

  if (ACTION_ID_PATTERN.test(trimmed)) {
    return normalizeActionId(trimmed)
  }

  const actionLogMatch: RegExpMatchArray | null = trimmed.match(/^📝\s+([a-z0-9]+(?:_[a-z0-9]+)+)$/i)

  if (actionLogMatch) {
    return normalizeActionId(actionLogMatch[1])
  }

  return null
}

function formatNumber(value: number, fractionDigits = 1): string {
  const rounded: number = Number(value.toFixed(fractionDigits))

  return `${rounded}`
}

function resolveMetricLabel(metricKey: string): string {
  const key: string = String(metricKey || '').trim()

  if (!key) return ''

  if (METRIC_LABELS[key]) return METRIC_LABELS[key]

  const skill: SkillDef | undefined = getSkillByKey(key)

  if (skill?.label) return skill.label

  return key
}

function formatSignedValue(value: number, fractionDigits = 1): string {
  const sign: string = value > 0 ? '+' : ''

  return `${sign}${formatNumber(value, fractionDigits)}`
}

function buildActionEffectsFromMetadata(metadata: ActionMetadata | null | undefined): string {
  if (!metadata || typeof metadata !== 'object') return ''

  const parts: string[] = []
  const statChanges: Record<string, number> | undefined = metadata.statChanges
  const skillChanges: Record<string, number> | undefined = metadata.skillChanges
  const moneyDelta: number | undefined = metadata.moneyDelta
  const hoursSpent: number | undefined = metadata.hoursSpent

  if (statChanges && typeof statChanges === 'object') {
    for (const [key, value] of Object.entries(statChanges)) {
      if (typeof value !== 'number' || value === 0) continue

      parts.push(`${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`)
    }
  }

  if (skillChanges && typeof skillChanges === 'object') {
    for (const [key, value] of Object.entries(skillChanges)) {
      if (typeof value !== 'number' || value === 0) continue

      parts.push(`${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`)
    }
  }

  if (typeof moneyDelta === 'number' && moneyDelta !== 0) {
    parts.push(`Деньги: ${formatSignedValue(moneyDelta, 0)} ₽`)
  }

  if (typeof hoursSpent === 'number' && hoursSpent > 0) {
    parts.push(`Время: ${formatNumber(hoursSpent, 1)} ч`)
  }

  if (parts.length === 0) return ''

  return parts.map((line: string) => `• ${line}`).join('\n')
}

function translateRawEffectsText(rawText: unknown): string {
  const raw: string = typeof rawText === 'string' ? rawText.trim() : ''

  if (!raw) return ''

  const chunks: string[] = raw
    .split(',')
    .map((chunk: string): string => chunk.trim())
    .filter(Boolean)

  if (chunks.length === 0) return raw

  const translated: string[] = chunks.map(
    (chunk: string): string => {
      const match: RegExpMatchArray | null = chunk.match(/^([a-z0-9_]+)\s*:\s*([+-]?\d+(?:\.\d+)?)$/i)

      if (!match) return chunk

      const key: string = match[1] ?? ''
      const value: number = Number(match[2] ?? NaN)

      if (!Number.isFinite(value)) return chunk

      return `${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`
    },
  )

  return translated.map((line: string) => `• ${line}`).join('\n')
}

/**
 * @description [Activity log] - resolves a user-facing title for an activity log entry.
 * @return { string } formatted title for display
 */
export function resolveActivityLogTitle(entry: ActivityLogEntry | null | undefined): string {
  const rawTitle: string = entry?.title ? String(entry.title) : ''

  if (!rawTitle) return 'Без заголовка'

  const metadataActionId: string | null = normalizeActionId(entry?.metadata?.actionId)
  const extractedActionId: string | null = extractActionIdFromTitle(rawTitle)
  const actionId: string | null = metadataActionId || extractedActionId

  if (!actionId) return rawTitle

  const action: BalanceAction | null = getActionById(actionId)

  if (!action?.title) return rawTitle

  return rawTitle.startsWith('📝') ? `📝 ${action.title}` : action.title
}

/**
 * @description [Activity log] - resolves a user-facing description for an activity log entry.
 * @return { string } formatted description for display
 */
export function resolveActivityLogDescription(entry: ActivityLogEntry | null | undefined): string {
  const rawDescription: string = entry?.description ? String(entry.description) : ''

  if (entry?.type !== 'action') return rawDescription

  const fromMetadata: string = buildActionEffectsFromMetadata(entry?.metadata)

  if (fromMetadata) return fromMetadata

  return translateRawEffectsText(rawDescription)
}
