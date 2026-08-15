import { getSkillByKey } from '@/domain/balance/constants/skills-constants'
import type { ActionEffectDisplay } from './ActionCard.types'

const SKILL_EFFECT_EXPLANATION: string = 'Опыт за практику зависит от числа часов, способа обучения и возраста персонажа.'

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
