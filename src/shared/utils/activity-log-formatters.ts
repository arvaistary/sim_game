import { getActionById } from '../../domain/balance/actions/index'
import { getSkillByKey } from '../../domain/balance/skills-constants'

const ACTION_ID_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)+$/i

const ACTION_ID_ALIASES: Record<string, string> = {
  shop_full_lanch: 'shop_full_lunch',
}

const METRIC_LABELS: Record<string, string> = {
  hunger: 'Голод',
  energy: 'Энергия',
  stress: 'Стресс',
  mood: 'Настроение',
  health: 'Здоровье',
  physical: 'Физическая форма',
  memory: 'Память',
  concentration: 'Концентрация',
  creativity: 'Креативность',
  organization: 'Организация',
  professionalism: 'Профессионализм',
}

interface ActionMetadata {
  statChanges?: Record<string, number>
  skillChanges?: Record<string, number>
  moneyDelta?: number
  hoursSpent?: number
  actionId?: string
  [key: string]: unknown
}

interface ActivityLogEntry {
  title?: string
  description?: string
  type?: string
  metadata?: ActionMetadata
}

function normalizeActionId(actionId: unknown): string | null {
  if (typeof actionId !== 'string' || actionId.length === 0) return null
  const normalized = actionId.trim().toLowerCase()
  return ACTION_ID_ALIASES[normalized] || normalized
}

function extractActionIdFromTitle(title: string): string | null {
  if (typeof title !== 'string' || title.length === 0) return null
  const trimmed = title.trim()

  if (ACTION_ID_PATTERN.test(trimmed)) {
    return normalizeActionId(trimmed)
  }

  const actionLogMatch = trimmed.match(/^📝\s+([a-z0-9]+(?:_[a-z0-9]+)+)$/i)
  if (actionLogMatch) {
    return normalizeActionId(actionLogMatch[1])
  }

  return null
}

function formatNumber(value: number, fractionDigits = 1): string {
  const rounded = Number(value.toFixed(fractionDigits))
  return `${rounded}`
}

function resolveMetricLabel(metricKey: string): string {
  const key = String(metricKey || '').trim()
  if (!key) return ''
  if (METRIC_LABELS[key]) return METRIC_LABELS[key]

  const skill = getSkillByKey(key)
  if (skill?.label) return skill.label

  return key
}

function formatSignedValue(value: number, fractionDigits = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, fractionDigits)}`
}

function buildActionEffectsFromMetadata(metadata: ActionMetadata | null | undefined): string {
  if (!metadata || typeof metadata !== 'object') return ''

  const parts: string[] = []
  const statChanges = metadata.statChanges
  const skillChanges = metadata.skillChanges
  const moneyDelta = metadata.moneyDelta
  const hoursSpent = metadata.hoursSpent

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
  return parts.map((line) => `• ${line}`).join('\n')
}

function translateRawEffectsText(rawText: unknown): string {
  const raw = typeof rawText === 'string' ? rawText.trim() : ''
  if (!raw) return ''

  const chunks = raw.split(',').map((chunk) => chunk.trim()).filter(Boolean)
  if (chunks.length === 0) return raw

  const translated = chunks.map((chunk) => {
    const match = chunk.match(/^([a-z0-9_]+)\s*:\s*([+-]?\d+(?:\.\d+)?)$/i)
    if (!match) return chunk

    const key = match[1]
    const value = Number(match[2])
    if (!Number.isFinite(value)) return chunk

    return `${resolveMetricLabel(key)}: ${formatSignedValue(value, 1)}`
  })

  return translated.map((line) => `• ${line}`).join('\n')
}

export function resolveActivityLogTitle(entry: ActivityLogEntry | null | undefined): string {
  const rawTitle = entry?.title ? String(entry.title) : ''
  if (!rawTitle) return 'Без заголовка'

  const metadataActionId = normalizeActionId(entry?.metadata?.actionId)
  const extractedActionId = extractActionIdFromTitle(rawTitle)
  const actionId = metadataActionId || extractedActionId

  if (!actionId) return rawTitle

  const action = getActionById(actionId)
  if (!action?.title) return rawTitle

  return rawTitle.startsWith('📝') ? `📝 ${action.title}` : action.title
}

export function resolveActivityLogDescription(entry: ActivityLogEntry | null | undefined): string {
  const rawDescription = entry?.description ? String(entry.description) : ''
  if (entry?.type !== 'action') return rawDescription

  const fromMetadata = buildActionEffectsFromMetadata(entry?.metadata)
  if (fromMetadata) return fromMetadata

  return translateRawEffectsText(rawDescription)
}
