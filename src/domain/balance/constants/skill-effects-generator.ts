/**
 * Генератор модификаторов навыков из определений
 * Обеспечивает синхронизацию между skill definitions и фактическими эффектами
 */

import type { SkillDef, SkillModifiers } from '@domain/balance/types'
import { ALL_SKILLS } from './skills-constants'
import { isMultiplicativeModifier, createBaseSkillModifiers } from './skill-modifiers'

export interface SkillEffectMapping {
  skillKey: string
  effectKey: string
  calculateValue: (level: number) => number
  description: string
}

/**
 * Маппинг эффектов навыков на модификаторы
 * Каждая функция принимает уровень навыка и возвращает значение модификатора
 */
const SKILL_EFFECT_MAPPINGS: SkillEffectMapping[] = []

// Инициализируем маппинг из ALL_SKILLS
for (const skill of ALL_SKILLS) {
  if (!skill.effects) continue
  
  for (const [effectKey, effectFn] of Object.entries(skill.effects)) {
    const mapping: SkillEffectMapping = {
      skillKey: skill.key,
      effectKey,
      calculateValue: effectFn as (level: number) => number,
      description: `${skill.label} → ${effectKey}`
    }
    SKILL_EFFECT_MAPPINGS.push(mapping)
  }
}

/**
 * Генерировать модификаторы навыков из определений
 */
export function generateModifiersFromSkillDefs(skillLevels: Record<string, number>): Partial<SkillModifiers> {
  const modifiers: Partial<SkillModifiers> = {}
  
  for (const mapping of SKILL_EFFECT_MAPPINGS) {
    const level = skillLevels[mapping.skillKey] || 0
    if (level <= 0) continue
    
    const value = mapping.calculateValue(level)
    
    // Маппинг effectKey -> modifierKey
    const modifierKey = mapEffectToModifierKey(mapping.effectKey)
    if (!modifierKey) continue
    
    // Применяем значение к модификатору
    applyEffectToModifier(modifiers, modifierKey, value, mapping.effectKey)
  }
  
  return modifiers
}

/**
 * Маппинг ключей эффектов на ключи модификаторов
 */
function mapEffectToModifierKey(effectKey: string): keyof SkillModifiers | null {
  const mapping: Record<string, keyof SkillModifiers> = {
    // Базовые модификаторы
    'hungerDrainMultiplier': 'hungerDrainMultiplier',
    'energyDrainMultiplier': 'energyDrainMultiplier',
    'stressGainMultiplier': 'stressGainMultiplier',
    'moodRecoveryMultiplier': 'moodRecoveryMultiplier',
    'healthDecayMultiplier': 'healthDecayMultiplier',
    'salaryMultiplier': 'salaryMultiplier',
    'workEfficiencyMultiplier': 'workEfficiencyMultiplier',
    'workEfficiency': 'workEfficiencyMultiplier',
    'shopPriceMultiplier': 'shopPriceMultiplier',
    'investmentReturnMultiplier': 'investmentReturnMultiplier',
    'learningSpeedMultiplier': 'learningSpeedMultiplier',
    'homeComfortMultiplier': 'homeComfortMultiplier',
    'dailyExpenseMultiplier': 'dailyExpenseMultiplier',
    'positiveEventChanceBonus': 'positiveEventChanceBonus',
    'positiveEventChance': 'positiveEventChanceBonus',
    'negativeEventPenaltyReduction': 'negativeEventPenaltyReduction',
    'negativeEventMitigation': 'negativeEventPenaltyReduction',
    'relationshipGainMultiplier': 'relationshipGainMultiplier',
    'relationshipQualityMultiplier': 'relationshipGainMultiplier',
    'hobbyIncomeMultiplier': 'hobbyIncomeMultiplier',
    'passiveIncomeBonus': 'passiveIncomeBonus',
    'maxEnergyBonus': 'maxEnergyBonus',
    'agingSpeedMultiplier': 'agingSpeedMultiplier',
    'foodRecoveryMultiplier': 'foodRecoveryMultiplier',
    'recoveryEfficiency': 'foodRecoveryMultiplier',
    'promotionChanceBonus': 'promotionChanceBonus',
    'promotionChance': 'promotionChanceBonus',
    'allRecoveryMultiplier': 'allRecoveryMultiplier',
    'healthRecoveryMultiplier': 'healthRecoveryMultiplier',
    'eventChoiceHintBonus': 'eventChoiceHintBonus',
    'eventChoiceHint': 'eventChoiceHintBonus',
    'autoRecoveryWeekly': 'autoRecoveryWeekly',
    
    // Алиасы и синонимы
    'stressResistanceFromWork': 'stressGainMultiplier',
    'stressEventImmunity': 'negativeEventPenaltyReduction',
    'lowMoodPenaltyReduction': 'moodRecoveryMultiplier',
    'randomSkillGainChance': 'learningSpeedMultiplier',
    'friendHelpChance': 'positiveEventChanceBonus',
    'educationDecayReduction': 'learningSpeedMultiplier',
    'relearningBonus': 'learningSpeedMultiplier',
    'teamEventBonus': 'workEfficiencyMultiplier',
    'jobSalaryOnHire': 'salaryMultiplier',
    'jobSpecificSalaryBonus': 'salaryMultiplier',
    'investmentRiskReduction': 'investmentReturnMultiplier',
    'overtimeImmunity': 'stressGainMultiplier',
    'learningTechSpeed': 'learningSpeedMultiplier',
    'homeTechBonus': 'homeComfortMultiplier',
    'taxReduction': 'passiveIncomeBonus',
    'subordinateEfficiency': 'workEfficiencyMultiplier',
    'salesSuccess': 'salaryMultiplier',
    'overallEfficiency': 'workEfficiencyMultiplier',
    'legalPenaltyReduction': 'negativeEventPenaltyReduction',
    'agePenaltyAfter50': 'agingSpeedMultiplier',
    'lifeExpectancyBonus': 'agingSpeedMultiplier',
    'socialEventBonus': 'relationshipGainMultiplier',
    'healthBonus': 'healthRecoveryMultiplier',
    'energyRecoveryFromActivity': 'energyDrainMultiplier',
    'publicEventSuccess': 'positiveEventChanceBonus',
    'furnitureComfortBonus': 'homeComfortMultiplier',
    'homeFoodRecovery': 'foodRecoveryMultiplier',
    'memoryDecaySpeed': 'learningSpeedMultiplier',
    'negativeEventChance': 'negativeEventPenaltyReduction',
    'missedActionPenalty': 'workEfficiencyMultiplier',
    'agingPenaltyReduction': 'agingSpeedMultiplier',
    'giftQualityBonus': 'relationshipGainMultiplier',
    'workPeriodBonusChance': 'workEfficiencyMultiplier',
    'routinePenaltyReduction': 'stressGainMultiplier',
    'repairCostReduction': 'dailyExpenseMultiplier',
    'jobChangeCostReduction': 'negativeEventPenaltyReduction',
  }
  
  return mapping[effectKey] || null
}

/**
 * Применить эффект к модификатору
 */
function applyEffectToModifier(
  modifiers: Partial<SkillModifiers>,
  modifierKey: keyof SkillModifiers,
  value: number,
  effectKey: string
): void {
  const currentValue = modifiers[modifierKey] ?? getDefaultModifierValue(modifierKey)
  
  // Определяем как применять значение (аддитивно или мультипликативно)
  if (isMultiplicativeModifier(modifierKey)) {
    // Мультипликативные модификаторы перемножаются
    modifiers[modifierKey] = (currentValue as number) * value
  } else {
    // Аддитивные модификаторы складываются
    modifiers[modifierKey] = (currentValue as number) + value
  }
}

/**
 * Получить значение по умолчанию для модификатора
 */
function getDefaultModifierValue(modifierKey: keyof SkillModifiers): number {
  return createBaseSkillModifiers()[modifierKey] ?? 1.0
}

/**
 * Получить все эффекты для навыка (для UI explainability)
 */
export function getSkillEffectsForUi(skillKey: string, level: number): Array<{
  effectKey: string
  modifierKey: keyof SkillModifiers
  value: number
  description: string
}> {
  const effects: Array<{
    effectKey: string
    modifierKey: keyof SkillModifiers
    value: number
    description: string
  }> = []
  
  const skill = ALL_SKILLS.find(s => s.key === skillKey)
  if (!skill || !skill.effects) return effects
  
  for (const [effectKey, effectFn] of Object.entries(skill.effects)) {
    const modifierKey = mapEffectToModifierKey(effectKey)
    if (!modifierKey) continue
    
    const value = (effectFn as (level: number) => number)(level)
    
    effects.push({
      effectKey,
      modifierKey,
      value,
      description: getEffectDescription(effectKey, value, isMultiplicativeModifier(modifierKey))
    })
  }
  
  return effects
}

/**
 * Получить описание эффекта для UI
 */
function getEffectDescription(effectKey: string, value: number, isMultiplicative: boolean): string {
  const effectDescriptions: Record<string, string> = {
    'hungerDrainMultiplier': 'Скорость голода',
    'energyDrainMultiplier': 'Расход энергии',
    'stressGainMultiplier': 'Получение стресса',
    'moodRecoveryMultiplier': 'Восстановление настроения',
    'healthDecayMultiplier': 'Ухудшение здоровья',
    'salaryMultiplier': 'Зарплата',
    'workEfficiencyMultiplier': 'Эффективность работы',
    'shopPriceMultiplier': 'Цены в магазине',
    'investmentReturnMultiplier': 'Доходность инвестиций',
    'learningSpeedMultiplier': 'Скорость обучения',
    'homeComfortMultiplier': 'Комфорт дома',
    'dailyExpenseMultiplier': 'Ежедневные расходы',
    'positiveEventChanceBonus': 'Шанс позитивных событий',
    'negativeEventPenaltyReduction': 'Снижение ��егативных эффектов',
    'relationshipGainMultiplier': 'Рост отношений',
    'hobbyIncomeMultiplier': 'Доход от хобби',
    'passiveIncomeBonus': 'Пассивный доход',
    'maxEnergyBonus': 'Максимальная энергия',
    'agingSpeedMultiplier': 'Скорость старения',
    'foodRecoveryMultiplier': 'Восстановление от еды',
    'promotionChanceBonus': 'Шанс повышения',
    'allRecoveryMultiplier': 'Общее восстановление',
    'healthRecoveryMultiplier': 'Восстановление здоровья',
    'eventChoiceHintBonus': 'Подсказки в событиях',
    'autoRecoveryWeekly': 'Автовосстановление',
  }
  
  const baseDescription = effectDescriptions[effectKey] || effectKey
  
  if (isMultiplicative) {
    const percentChange = (value - 1) * 100
    if (percentChange > 0) {
      return `${baseDescription} +${percentChange.toFixed(1)}%`
    } else if (percentChange < 0) {
      return `${baseDescription} ${percentChange.toFixed(1)}%`
    } else {
      return baseDescription
    }
  } else {
    if (value > 0) {
      return `${baseDescription} +${value.toFixed(2)}`
    } else if (value < 0) {
      return `${baseDescription} ${value.toFixed(2)}`
    } else {
      return baseDescription
    }
  }
}

/**
 * Проверить синхронизацию между definitions и текущими модификаторами
 */
export function validateSkillEffectSync(): Array<{
  skillKey: string
  effectKey: string
  status: 'missing' | 'mismatch' | 'ok'
  expectedValue?: number
  actualValue?: number
}> {
  const results: Array<{
    skillKey: string
    effectKey: string
    status: 'missing' | 'mismatch' | 'ok'
    expectedValue?: number
    actualValue?: number
  }> = []
  
  // Эта функция будет использоваться для тестов
  // Пока возвращаем пустой массив, так как нужна интеграция с текущими модификаторами
  
  return results
}