import type { SkillModifiers } from '@domain/balance/types'

export interface ExplainabilityEffectItem {
  description: string
  value: string
  source?: string
}

export interface FactorItem {
  factor: string
  multiplier: number
  description: string
}

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

export interface ActiveEffectCategory {
  category: string
  effects: Array<ExplainabilityEffectItem>
}

export interface ExplainSkillGrowthContext {
  age?: number
  method?: string
  consecutiveUses?: number
  weeklyLearningHours?: number
  skillModifiers?: Partial<SkillModifiers>
}