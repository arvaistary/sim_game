import type { SkillModifiers } from '@domain/balance/types'

export const MULTIPLICATIVE_MODIFIERS: (keyof SkillModifiers)[] = [
  'hungerDrainMultiplier', 'energyDrainMultiplier', 'stressGainMultiplier',
  'healthDecayMultiplier', 'shopPriceMultiplier', 'dailyExpenseMultiplier',
  'agingSpeedMultiplier',
]
