interface EffectItem {
  description: string
  value: string
  source?: string
}

interface FactorItem {
  factor: string
  multiplier: number
  description: string
}

/**
 * Утилиты для объяснения эффектов навыков в UI
 * Показывает игроку, как навыки влияют на геймплей
 */

import type { SkillDef, SkillModifiers } from '@domain/balance/types'
import { ALL_SKILLS, getSkillByKey } from '../constants/skills-constants'
import { getSkillEffectsForUi } from '../constants/skill-effects-generator'
import { getSkillProgressionConfig, isXpModelActive } from '../constants/skill-progression-config'

export interface SkillContribution {
  skillKey: string
  skillName: string
  modifierKey: keyof SkillModifiers
  contribution: number
  description: string
}

export interface SkillGrowthExplanation {
  skillKey: string
  skillName: string
  xpGained: number
  levelChange: number
  factors: Array<FactorItem>
  totalMultiplier: number
}

/**
 * Получить вклад навыков в конкретный модификатор
 */
export function getSkillContributionsToModifier(
  modifierKey: keyof SkillModifiers,
  skillLevels: Record<string, number>
): SkillContribution[] {
  const contributions: SkillContribution[] = []
  
  for (const skill of ALL_SKILLS) {
    const level: boolean = skillLevels[skill.key] || 0

    if (level <= 0 || !skill.effects) continue
    
    const effects = getSkillEffectsForUi(skill.key, level)
    
    for (const effect of effects) {
      if (effect.modifierKey === modifierKey && Math.abs(effect.value - (isMultiplicativeModifier(modifierKey) ? 1 : 0)) > 0.001) {
        contributions.push({
          skillKey: skill.key,
          skillName: skill.label,
          modifierKey: effect.modifierKey,
          contribution: effect.value,
          description: effect.description
        })
      }
    }
  }
  
  // Сортируем по абсолютному вкладу (по убыванию)

  return contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

/**
 * Получить объяснение роста навыка
 */
export function explainSkillGrowth(
  skillKey: string,
  baseXpGain: number,
  finalXpGain: number,
  context: {
    age?: number
    method?: string
    consecutiveUses?: number
    weeklyLearningHours?: number
    skillModifiers?: Partial<SkillModifiers>
  } = {}
): SkillGrowthExplanation {
  const skill = getSkillByKey(skillKey)
  const config = getSkillProgressionConfig()
  
  const factors: Array<FactorItem> = []
  
  let totalMultiplier: number = 1.0
  
  // Возрастной множитель
  if (config.enableAgeMultipliers && context.age !== undefined) {
    const ageMultiplier = getAgeLearningMultiplier(context.age)

    if (ageMultiplier !== 1.0) {
      factors.push({
        factor: 'Возраст',
        multiplier: ageMultiplier,
        description: getAgeMultiplierDescription(context.age, ageMultiplier)
      })
      totalMultiplier *= ageMultiplier
    }
  }
  
  // Метод обучения
  if (context.method) {
    const methodMultiplier = getLearningMethodMultiplier(context.method as any)

    if (methodMultiplier !== 1.0) {
      factors.push({
        factor: 'Метод обучения',
        multiplier: methodMultiplier,
        description: getMethodMultiplierDescription(context.method, methodMultiplier)
      })
      totalMultiplier *= methodMultiplier
    }
  }
  
  // Зона комфорта (повторение одного и того же)
  if (config.enableBurnout && context.consecutiveUses !== undefined) {
    const comfortMultiplier = getComfortZoneMultiplier(context.consecutiveUses)

    if (comfortMultiplier !== 1.0) {
      factors.push({
        factor: 'Зона комфорта',
        multiplier: comfortMultiplier,
        description: getComfortZoneDescription(context.consecutiveUses, comfortMultiplier)
      })
      totalMultiplier *= comfortMultiplier
    }
  }
  
  // Перегорание
  if (config.enableBurnout && context.weeklyLearningHours !== undefined) {
    const burnoutMultiplier = getBurnoutMultiplier(context.weeklyLearningHours).multiplier

    if (burnoutMultiplier !== 1.0) {
      factors.push({
        factor: 'Перегорание',
        multiplier: burnoutMultiplier,
        description: getBurnoutDescription(context.weeklyLearningHours, burnoutMultiplier)
      })
      totalMultiplier *= burnoutMultiplier
    }
  }
  
  // Модификаторы навыков (например, learningSpeedMultiplier)
  if (context.skillModifiers?.learningSpeedMultiplier && context.skillModifiers.learningSpeedMultiplier !== 1.0) {
    factors.push({
      factor: 'Бонусы навыков',
      multiplier: context.skillModifiers.learningSpeedMultiplier,
      description: `Общий множитель скорости обучения: ${((context.skillModifiers.learningSpeedMultiplier - 1) * 100).toFixed(1)}%`
    })
    totalMultiplier *= context.skillModifiers.learningSpeedMultiplier
  }
  
  // Нелинейная сложность (diminishing returns)
  if (isXpModelActive()) {
    const difficultyMultiplier = getDifficultyMultiplier(baseXpGain, finalXpGain)

    if (difficultyMultiplier !== 1.0) {
      factors.push({
        factor: 'Сложность уровня',
        multiplier: difficultyMultiplier,
        description: 'Высокие уровни требуют больше усилий'
      })
      totalMultiplier *= difficultyMultiplier
    }
  }
  
  const levelChange = Math.floor(finalXpGain / 10) - Math.floor(baseXpGain / 10)
  
  return {
    skillKey,
    skillName: skill?.label || skillKey,
    xpGained: finalXpGain - baseXpGain,
    levelChange,
    factors,
    totalMultiplier
  }
}

/**
 * Получить текущие активные эффекты игрока (для панели статуса)
 */
export function getPlayerActiveEffects(
  skillLevels: Record<string, number>,
  skillModifiers: SkillModifiers
): Array<{
  category: string
  effects: Array<EffectItem>
}> {
  const categories: Record<string, Array<{
    description: string
    value: string
    source?: string
  }>> = {}
  
  // Эффекты от навыков
  for (const skill of ALL_SKILLS) {
    const level: boolean = skillLevels[skill.key] || 0

    if (level <= 0) continue
    
    const effects = getSkillEffectsForUi(skill.key, level)
    
    for (const effect of effects) {
      if (Math.abs(effect.value - (isMultiplicativeModifier(effect.modifierKey) ? 1 : 0)) < 0.001) {
        continue // Пропускаем незначительные эффекты
      }
      
      const category = getModifierCategory(effect.modifierKey)

      if (!categories[category]) {
        categories[category] = []
      }
      
      categories[category].push({
        description: effect.description,
        value: formatModifierValue(effect.modifierKey, effect.value),
        source: skill.label
      })
    }
  }
  
  // Преобразуем в массив

  return Object.entries(categories).map(([category, effects]) => ({
    category,
    effects
  }))
}

// Вспомогательные функции

function isMultiplicativeModifier(modifierKey: keyof SkillModifiers): boolean {
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

function getAgeLearningMultiplier(age: number): number {
  if (age <= 7) return 2.5

  if (age <= 12) return 2.0

  if (age <= 18) return 1.7

  if (age <= 25) return 1.4

  if (age <= 35) return 1.1

  if (age <= 45) return 0.8

  if (age <= 60) return 0.5

  return 0.3
}

function getAgeMultiplierDescription(age: number, multiplier: number): string {
  const ageGroup = age <= 18 ? 'молодой возраст' : age <= 35 ? 'зрелый возраст' : 'старший возраст'
  const effect = multiplier > 1 ? 'ускоряет' : 'замедляет'
  const percent = Math.abs(multiplier - 1) * 100
  
  return `${ageGroup} ${effect} обучение на ${percent.toFixed(0)}%`
}

function getLearningMethodMultiplier(method: 'work' | 'practice' | 'courses' | 'books' | 'videos'): number {
  const multipliers = {
    work: 2.2,
    practice: 1.5,
    courses: 1.0,
    books: 0.7,
    videos: 0.4
  }

  return multipliers[method] || 1.0
}

function getMethodMultiplierDescription(method: string, multiplier: number): string {
  const methodNames: Record<string, string> = {
    work: 'Работа',
    practice: 'Практика',
    courses: 'Курсы',
    books: 'Книги',
    videos: 'Видео'
  }
  
  const name: boolean = methodNames[method] || method
  const percent = (multiplier - 1) * 100
  const sign = percent > 0 ? '+' : ''
  
  return `${name}: ${sign}${percent.toFixed(0)}% эффективности`
}

function getComfortZoneMultiplier(consecutiveUses: number): number {
  if (consecutiveUses <= 5) return 1.0
  const penalty = (consecutiveUses - 5) * 0.15

  return Math.max(0.2, 1 - penalty)
}

function getComfortZoneDescription(consecutiveUses: number, multiplier: number): string {
  if (consecutiveUses > 5) {
    const penalty = (1 - multiplier) * 100

    return `Повторение одного и того же: -${penalty.toFixed(0)}% (${consecutiveUses} раз подряд)`
  }

  return 'Разнообразие действий: максимальная эффективность'
}

function getBurnoutMultiplier(weeklyHours: number): { multiplier: number; stressBonus: number } {
  if (weeklyHours <= 30) return { multiplier: 1.0, stressBonus: 0 }

  if (weeklyHours >= 50) return { multiplier: 0, stressBonus: 0.15 }
  
  const extraHours: number = weeklyHours - 30
  const penalty: number = extraHours * 0.05

  return {
    multiplier: Math.max(0, 1 - penalty),
    stressBonus: 0.15
  }
}

function getBurnoutDescription(weeklyHours: number, multiplier: number): string {
  if (weeklyHours > 30) {
    const penalty = (1 - multiplier) * 100

    return `Переутомление: -${penalty.toFixed(0)}% (${weeklyHours} часов/неделю)`
  }

  return 'Нормальная нагрузка: полная эффективность'
}

function getDifficultyMultiplier(baseXp: number, finalXp: number): number {
  const baseLevel = Math.floor(baseXp / 10)
  const finalLevel = Math.floor(finalXp / 10)
  
  if (finalLevel <= 3) return 1.0

  if (finalLevel <= 6) return 1.35

  if (finalLevel <= 8) return 1.8

  return 2.6
}

function getModifierCategory(modifierKey: keyof SkillModifiers): string {
  const categories: Record<string, string[]> = {
    'Экономика': ['salaryMultiplier', 'shopPriceMultiplier', 'investmentReturnMultiplier', 'hobbyIncomeMultiplier', 'passiveIncomeBonus', 'dailyExpenseMultiplier'],
    'Здоровье': ['hungerDrainMultiplier', 'energyDrainMultiplier', 'maxEnergyBonus', 'healthDecayMultiplier', 'healthRecoveryMultiplier', 'foodRecoveryMultiplier', 'agingSpeedMultiplier'],
    'Психика': ['stressGainMultiplier', 'moodRecoveryMultiplier', 'allRecoveryMultiplier'],
    'Обучение': ['learningSpeedMultiplier'],
    'Работа': ['workEfficiencyMultiplier', 'promotionChanceBonus', 'autoRecoveryWeekly'],
    'Социальное': ['relationshipGainMultiplier', 'positiveEventChanceBonus', 'negativeEventPenaltyReduction', 'eventChoiceHintBonus'],
    'Быт': ['homeComfortMultiplier']
  }
  
  for (const [category, keys] of Object.entries(categories)) {
    if (keys.includes(modifierKey)) {
      return category
    }
  }
  
  return 'Прочее'
}

function formatModifierValue(modifierKey: keyof SkillModifiers, value: number): string {
  if (isMultiplicativeModifier(modifierKey)) {
    const percent = (value - 1) * 100
    const sign = percent > 0 ? '+' : ''

    return `${sign}${percent.toFixed(1)}%`
  } else {
    const sign = value > 0 ? '+' : ''

    return `${sign}${value.toFixed(2)}`
  }
}