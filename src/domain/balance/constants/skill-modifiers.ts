import type { SkillModifiers, SkillEffect } from '@/domain/balance/types'
import { ALL_SKILLS } from './skills-constants'

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

export function recalculateSkillModifiers(skillLevels: Record<string, number>): SkillModifiers {
  const modifiers = createBaseSkillModifiers()

  if (!skillLevels || typeof skillLevels !== 'object') {
    return modifiers
  }

  for (const skill of ALL_SKILLS) {
    const level = skillLevels[skill.key] ?? 0
    if (level <= 0 || !skill.effects) continue

    const lvl = level

    if (skill.key === 'timeManagement') {
      modifiers.energyDrainMultiplier *= (1 - lvl * 0.025)
      modifiers.stressGainMultiplier *= (1 - lvl * 0.02)
      modifiers.workEfficiencyMultiplier *= (1 + lvl * 0.015)
      modifiers.learningSpeedMultiplier *= (1 + lvl * 0.03)
    }

    if (skill.key === 'communication') {
      modifiers.positiveEventChanceBonus += lvl * 0.012
      modifiers.relationshipGainMultiplier *= (1 + lvl * 0.04)
      modifiers.salaryMultiplier *= (1 + lvl * 0.015)
    }

    if (skill.key === 'financialLiteracy') {
      modifiers.shopPriceMultiplier *= (1 - lvl * 0.018)
      modifiers.investmentReturnMultiplier *= (1 + lvl * 0.035)
      modifiers.passiveIncomeBonus += lvl * 50
    }

    if (skill.key === 'healthyLifestyle') {
      modifiers.hungerDrainMultiplier *= (1 - lvl * 0.022)
      modifiers.healthDecayMultiplier *= (1 - lvl * 0.03)
      modifiers.foodRecoveryMultiplier *= (1 + lvl * 0.025)
    }

    if (skill.key === 'adaptability') {
      modifiers.negativeEventPenaltyReduction += lvl * 0.04
    }

    if (skill.key === 'discipline') {
      modifiers.learningSpeedMultiplier *= (1 + lvl * 0.025)
    }

    if (skill.key === 'physicalFitness') {
      modifiers.maxEnergyBonus += lvl * 4
      modifiers.energyDrainMultiplier *= (1 - lvl * 0.01)
    }

    if (skill.key === 'emotionalIntelligence') {
      modifiers.moodRecoveryMultiplier *= (1 + lvl * 0.045)
      modifiers.negativeEventPenaltyReduction += lvl * 0.025
    }

    if (skill.key === 'organization') {
      modifiers.homeComfortMultiplier *= (1 + lvl * 0.025)
      modifiers.dailyExpenseMultiplier *= (1 - lvl * 0.015)
    }

    if (skill.key === 'basicCreativity') {
      modifiers.hobbyIncomeMultiplier *= (1 + lvl * 0.04)
      modifiers.positiveEventChanceBonus += lvl * 0.01
    }

    if (skill.key === 'stressResistance') {
      modifiers.stressGainMultiplier *= (1 - lvl * 0.035)
    }

    if (skill.key === 'selfControl') {
      modifiers.negativeEventPenaltyReduction += lvl * 0.02
    }

    if (skill.key === 'curiosity') {
      modifiers.learningSpeedMultiplier *= (1 + lvl * 0.03)
    }

    if (skill.key === 'empathy') {
      modifiers.relationshipGainMultiplier *= (1 + lvl * 0.05)
    }

    if (skill.key === 'memory') {
      modifiers.learningSpeedMultiplier *= (1 + lvl * 0.02)
    }

    if (skill.key === 'professionalism') {
      modifiers.salaryMultiplier *= (1 + lvl * 0.04)
      modifiers.workEfficiencyMultiplier *= (1 + lvl * 0.02)
    }

    if (skill.key === 'leadership') {
      modifiers.salaryMultiplier *= (1 + lvl * 0.02)
      modifiers.promotionChanceBonus += lvl * 0.035
    }

    if (skill.key === 'negotiations') {
      modifiers.salaryMultiplier *= (1 + lvl * 0.025)
      modifiers.shopPriceMultiplier *= (1 - lvl * 0.008)
    }

    if (skill.key === 'analyticalThinking') {
      modifiers.investmentReturnMultiplier *= (1 + lvl * 0.04)
    }

    if (skill.key === 'specialization') {
      modifiers.salaryMultiplier *= (1 + lvl * 0.07)
    }

    if (skill.key === 'stressResistancePro') {
      modifiers.stressGainMultiplier *= (1 - lvl * 0.035)
    }

    if (skill.key === 'technicalLiteracy') {
      modifiers.learningSpeedMultiplier *= (1 + lvl * 0.06)
      modifiers.homeComfortMultiplier *= (1 + lvl * 0.04)
    }

    if (skill.key === 'cooking') {
      modifiers.foodRecoveryMultiplier *= (1 + lvl * 0.07)
      modifiers.dailyExpenseMultiplier *= (1 - lvl * 0.02)
    }

    if (skill.key === 'marketing') {
      modifiers.hobbyIncomeMultiplier *= (1 + lvl * 0.09)
      modifiers.passiveIncomeBonus += lvl * 120
    }

    if (skill.key === 'financialAnalysis') {
      modifiers.investmentReturnMultiplier *= (1 + lvl * 0.05)
    }

    if (skill.key === 'sales') {
      modifiers.shopPriceMultiplier *= (1 - lvl * 0.01)
      modifiers.workEfficiencyMultiplier *= (1 + lvl * 0.01)
    }

    if (skill.key === 'strategicPlanning') {
      modifiers.workEfficiencyMultiplier *= (1 + lvl * 0.03)
    }

    if (skill.key === 'medicalKnowledge') {
      modifiers.healthRecoveryMultiplier *= (1 + lvl * 0.08)
      modifiers.agingSpeedMultiplier *= (1 - lvl * 0.04)
    }

    if (skill.key === 'charisma') {
      modifiers.relationshipGainMultiplier *= (1 + lvl * 0.06)
    }

    if (skill.key === 'humor') {
      modifiers.moodRecoveryMultiplier *= (1 + lvl * 0.05)
      modifiers.positiveEventChanceBonus += lvl * 0.02
    }

    if (skill.key === 'patience') {
      modifiers.stressGainMultiplier *= (1 - lvl * 0.02)
    }

    if (skill.key === 'optimism') {
      modifiers.allRecoveryMultiplier *= (1 + lvl * 0.025)
      modifiers.moodRecoveryMultiplier *= (1 + lvl * 0.03)
    }

    if (skill.key === 'flexibleThinking') {
      modifiers.agingSpeedMultiplier *= (1 - lvl * 0.02)
    }

    if (skill.key === 'selfDisciplineExtended') {
      modifiers.autoRecoveryWeekly += lvl >= 10 ? 5 : Math.round(lvl * 0.5)
      modifiers.workEfficiencyMultiplier *= (1 + lvl * 0.01)
    }

    if (skill.key === 'intuition') {
      modifiers.positiveEventChanceBonus += lvl * 0.03
      modifiers.eventChoiceHintBonus += lvl * 0.03
    }

    if (skill.key === 'wisdom') {
      modifiers.agingSpeedMultiplier *= (1 - lvl * 0.03)
    }

    if (skill.key === 'artisticMastery') {
      modifiers.hobbyIncomeMultiplier *= (1 + lvl * 0.08)
    }

    if (skill.key === 'musicalAbility') {
      modifiers.moodRecoveryMultiplier *= (1 + lvl * 0.07)
    }

    if (skill.key === 'writing') {
      modifiers.hobbyIncomeMultiplier *= (1 + lvl * 0.06)
      if (lvl >= 10) {
        modifiers.passiveIncomeBonus += lvl * 100
      }
    }

    if (skill.key === 'photography') {
      modifiers.relationshipGainMultiplier *= (1 + lvl * 0.03)
    }

    if (skill.key === 'gardening') {
      modifiers.homeComfortMultiplier *= (1 + lvl * 0.04)
    }

    if (skill.key === 'handiness') {
      modifiers.dailyExpenseMultiplier *= (1 - lvl * 0.02)
    }

    if (skill.key === 'dance') {
      modifiers.energyDrainMultiplier *= (1 - lvl * 0.02)
    }

    if (skill.key === 'acting') {
      modifiers.positiveEventChanceBonus += lvl * 0.02
    }

    if (skill.key === 'interiorDesign') {
      modifiers.homeComfortMultiplier *= (1 + lvl * 0.06)
    }

    if (skill.key === 'culinaryArt') {
      modifiers.foodRecoveryMultiplier *= (1 + lvl * 0.1)
    }
  }

  return clampSkillModifiers(modifiers)
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

