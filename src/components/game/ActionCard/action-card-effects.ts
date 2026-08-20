import { METRIC_LABELS } from '@/constants/metric-labels'
import { getSkillByKey } from '@/domain/balance/constants/skills-constants'
import type { ActionEffectDisplay } from './ActionCard.types'

const SKILL_EFFECT_EXPLANATION: string = 'Опыт за практику зависит от числа часов, способа обучения и возраста персонажа.'

/**
 * Формирует список изменений ресурсов для попапа действия.
 * @description [Components] - подписи метрик со знаком и величиной.
 * @return { ActionEffectDisplay[] } эффекты ресурсов
 */
export function createResourceEffects(changes: Record<string, number | undefined> | undefined): ActionEffectDisplay[] {
  if (!changes) return []

  return Object.entries(changes)
    .filter(([, value]: [string, number | undefined]) => typeof value === 'number' && value !== 0)
    .map(([key, value]: [string, number | undefined]): ActionEffectDisplay => {
      const numericValue: number = value as number
      const label: string = METRIC_LABELS[key] ?? key
      const displayValue: number = Number(numericValue.toFixed(2))
      const sign: string = displayValue > 0 ? '+' : ''

      return {
        id: `resource-${key}`,
        text: `${label} ${sign}${displayValue}`,
        explanation: `значение ресурса «${label}» ${numericValue > 0 ? 'увеличится' : 'уменьшится'} на ${Math.abs(numericValue)} за действие.`,
      }
    })
}

/**
 * Формирует список развиваемых навыков для карточки действия.
 * @description [Components] - показывает навыки и их приоритет без ложного числового прироста.
 * @return { ActionEffectDisplay[] } эффекты навыков
 */
export function createSkillEffects(skillChanges: Record<string, number> | undefined): ActionEffectDisplay[] {
  if (!skillChanges) return []

  return Object.entries(skillChanges)
    .filter(([, weight]: [string, number]) => weight > 0)
    .sort(([, firstWeight]: [string, number], [, secondWeight]: [string, number]) => secondWeight - firstWeight)
    .map(([skillKey]: [string, number]): ActionEffectDisplay => ({
      id: `skill-${skillKey}`,
      text: `Развивает: ${getSkillByKey(skillKey)?.label ?? skillKey}`,
      explanation: SKILL_EFFECT_EXPLANATION,
    }))
}
