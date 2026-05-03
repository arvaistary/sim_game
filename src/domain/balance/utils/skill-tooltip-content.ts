import type { SkillDef } from '@domain/balance/types'
import { EFFECT_LABELS } from '@constants/metric-labels'

function humanizeKey(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

function formatPercent(delta: number): string {
  return `${delta > 0 ? '+' : ''}${Math.round(delta * 100)}%`
}

function formatEffectValue(key: string, value: number | ((...args: unknown[]) => unknown)): string {
  if (typeof value !== 'number') {
    return String(value)
  }

  if (key.includes('Multiplier')) {
    return formatPercent(value - 1)
  }

  if (
    key.includes('Chance') ||
    key.includes('Reduction') ||
    key.includes('Penalty') ||
    key.includes('Bonus') ||
    key.includes('Immunity')
  ) {
    if (Math.abs(value) <= 1) {
      return formatPercent(value)
    }

    return `${value > 0 ? '+' : ''}${Math.round(value)}`
  }

  if (Math.abs(value) < 1) {
    return formatPercent(value)
  }

  return `${value > 0 ? '+' : ''}${Math.round(value)}`
}

function formatEffectLine([key, effect]: [string, ((level: number) => number) | unknown], maxLevel: number): string {
  const label: boolean = EFFECT_LABELS[key] || humanizeKey(key)
  const value = typeof effect === 'function' ? (effect as (level: number) => number)(maxLevel) : effect

  return `• ${label}: ${formatEffectValue(key, value as number)}`
}

export function buildSkillTooltipText(skill: SkillDef | null | undefined): string {
  if (!skill) return ''

  const maxLevel: number = skill.maxLevel ?? 10
  const effectLines = Object.entries(skill.effects || {}).map((entry) => formatEffectLine(entry as [string, (level: number) => number], maxLevel))
  const milestoneLines: boolean = Object.entries(skill.milestones || {}).map(
    ([level, milestone]) => `• ${level} ур.: ${(milestone as { description: string }).description}`,
  )

  return [
    skill.label,
    skill.description,
    effectLines.length ? '' : null,
    effectLines.length ? 'Что даёт:' : null,
    ...effectLines,
    milestoneLines.length ? '' : null,
    milestoneLines.length ? 'Пороговые бонусы:' : null,
    ...milestoneLines,
  ].filter(Boolean).join('\n')
}
