import type { SkillModifiers, SkillEffect } from '@domain/balance/types'
import { ALL_SKILLS } from './skills-constants'
import { generateModifiersFromSkillDefs } from './skill-effects-generator'

export function createBaseSkillModifiers(): SkillModifiers {
  return {
    hungerDrainMultiplier: 1.0,
    energyDrainMultiplier: 1.0,
    stressGainMultiplier: 1.0,
    moodRecoveryMultiplier: 1.0,
    healthDecayMultiplier: 1.0,
    salaryMultiplier: 1.0,
    workEfficiencyMultiplier: 1.0,
    shopPriceMultiplier: 1.0,
    investmentReturnMultiplier: 1.0,
    learningSpeedMultiplier: 1.0,
    homeComfortMultiplier: 1.0,
    dailyExpenseMultiplier: 1.0,
    positiveEventChanceBonus: 0.0,
    negativeEventPenaltyReduction: 0.0,
    relationshipGainMultiplier: 1.0,
    hobbyIncomeMultiplier: 1.0,
    passiveIncomeBonus: 0,
    maxEnergyBonus: 0,
    agingSpeedMultiplier: 1.0,
    foodRecoveryMultiplier: 1.0,
    promotionChanceBonus: 0.0,
    allRecoveryMultiplier: 1.0,
    healthRecoveryMultiplier: 1.0,
    eventChoiceHintBonus: 0.0,
    autoRecoveryWeekly: 0,
  }
}

export function recalculateSkillModifiers(skillLevels: Record<string, number | { level?: number; xp?: number }>): SkillModifiers {
  const modifiers = createBaseSkillModifiers()

  if (!skillLevels || typeof skillLevels !== 'object') {
    return modifiers
  }

  // Извлекаем уровни навыков в плоский формат
  const flatSkillLevels: Record<string, number> = {}
  for (const [key, value] of Object.entries(skillLevels)) {
    flatSkillLevels[key] = typeof value === 'number' ? value : (value?.level ?? 0)
  }

  // Генерируем модификаторы из определений навыков
  const generatedModifiers = generateModifiersFromSkillDefs(flatSkillLevels)
  
  // Комбинируем с базовыми модификаторами
  for (const [key, value] of Object.entries(generatedModifiers)) {
    const modifierKey = key as keyof SkillModifiers
    if (isMultiplicativeModifier(modifierKey)) {
      modifiers[modifierKey] = (modifiers[modifierKey] as number) * (value as number)
    } else {
      modifiers[modifierKey] = (modifiers[modifierKey] as number) + (value as number)
    }
  }

  // Дополнительные ручные модификаторы (для обратной совместимости)
  // Можно пос��епенно мигрир��вать их в definitions

  return clampSkillModifiers(modifiers)
}

/**
 * Проверить, является ли модификатор мультипликативным
 */
export function isMultiplicativeModifier(modifierKey: keyof SkillModifiers): boolean {
  const multiplicativeModifiers: (keyof SkillModifiers)[] = [
    'hungerDrainMultiplier',
    'energyDrainMultiplier',
    'stressGainMultiplier',
    'moodRecoveryMultiplier',
    'healthDecayMultiplier',
    'salaryMultiplier',
    'workEfficiencyMultiplier',
    'shopPriceMultiplier',
    'investmentReturnMultiplier',
    'learningSpeedMultiplier',
    'homeComfortMultiplier',
    'dailyExpenseMultiplier',
    'relationshipGainMultiplier',
    'hobbyIncomeMultiplier',
    'agingSpeedMultiplier',
    'foodRecoveryMultiplier',
    'allRecoveryMultiplier',
    'healthRecoveryMultiplier',
  ]
  
  return multiplicativeModifiers.includes(modifierKey)
}

export function clampSkillModifiers(modifiers: SkillModifiers): SkillModifiers {
  const clamped = { ...modifiers }

  clamped.salaryMultiplier = Math.max(0.5, Math.min(5.0, clamped.salaryMultiplier))
  clamped.shopPriceMultiplier = Math.max(0.4, Math.min(1.0, clamped.shopPriceMultiplier))
  clamped.stressGainMultiplier = Math.max(0.2, Math.min(1.5, clamped.stressGainMultiplier))
  clamped.energyDrainMultiplier = Math.max(0.3, Math.min(1.5, clamped.energyDrainMultiplier))
  clamped.hungerDrainMultiplier = Math.max(0.3, Math.min(1.5, clamped.hungerDrainMultiplier))
  clamped.moodRecoveryMultiplier = Math.max(0.5, Math.min(3.0, clamped.moodRecoveryMultiplier))
  clamped.learningSpeedMultiplier = Math.max(0.5, Math.min(3.0, clamped.learningSpeedMultiplier))
  clamped.investmentReturnMultiplier = Math.max(0.5, Math.min(3.0, clamped.investmentReturnMultiplier))
  clamped.hobbyIncomeMultiplier = Math.max(0.5, Math.min(5.0, clamped.hobbyIncomeMultiplier))
  clamped.homeComfortMultiplier = Math.max(0.5, Math.min(3.0, clamped.homeComfortMultiplier))
  clamped.dailyExpenseMultiplier = Math.max(0.5, Math.min(1.5, clamped.dailyExpenseMultiplier))
  clamped.workEfficiencyMultiplier = Math.max(0.5, Math.min(3.0, clamped.workEfficiencyMultiplier))
  clamped.healthDecayMultiplier = Math.max(0.3, Math.min(1.5, clamped.healthDecayMultiplier))
  clamped.agingSpeedMultiplier = Math.max(0.3, Math.min(1.2, clamped.agingSpeedMultiplier))
  clamped.foodRecoveryMultiplier = Math.max(0.5, Math.min(3.0, clamped.foodRecoveryMultiplier))
  clamped.allRecoveryMultiplier = Math.max(0.5, Math.min(2.5, clamped.allRecoveryMultiplier))
  clamped.healthRecoveryMultiplier = Math.max(0.5, Math.min(3.0, clamped.healthRecoveryMultiplier))
  clamped.relationshipGainMultiplier = Math.max(0.5, Math.min(3.0, clamped.relationshipGainMultiplier))
  clamped.positiveEventChanceBonus = Math.max(0, Math.min(1.0, clamped.positiveEventChanceBonus))
  clamped.negativeEventPenaltyReduction = Math.max(0, Math.min(0.8, clamped.negativeEventPenaltyReduction))
  clamped.eventChoiceHintBonus = Math.max(0, Math.min(0.5, clamped.eventChoiceHintBonus))
  clamped.passiveIncomeBonus = Math.max(0, Math.min(50000, clamped.passiveIncomeBonus))
  clamped.maxEnergyBonus = Math.max(0, Math.min(100, clamped.maxEnergyBonus))
  clamped.promotionChanceBonus = Math.max(0, Math.min(0.5, clamped.promotionChanceBonus))
  clamped.autoRecoveryWeekly = Math.max(0, Math.min(20, clamped.autoRecoveryWeekly))

  return clamped
}

export function getSkillMilestones(
  skillKey: string,
  skillLevels: Record<string, number>,
): Array<{ threshold: number; description: string }> {
  const level = skillLevels?.[skillKey] ?? 0
  const skill = ALL_SKILLS.find(s => s.key === skillKey)
  if (!skill || !skill.milestones) return []

  const achieved: Array<{ threshold: number; description: string }> = []
  for (const [threshold, data] of Object.entries(skill.milestones)) {
    if (level >= parseInt(threshold, 10)) {
      achieved.push({ threshold: parseInt(threshold, 10), ...data })
    }
  }

  return achieved
}

