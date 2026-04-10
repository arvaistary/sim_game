import type { ActionCategory, StatChanges } from '@/domain/balance/types'

export interface BalanceAction {
  id: string
  category: ActionCategory
  title: string
  hourCost: number
  price: number
  actionType: string
  effect: string
  mood?: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  relationshipDelta?: number
  housingComfortDelta?: number
  oneTime?: boolean
  furnitureId?: string
  housingUpgradeLevel?: number
  requirements?: Record<string, unknown>
  cooldown?: { hours: number }
  subscription?: {
    monthlyCost: number
    effectPerWeek?: {
      statChanges?: StatChanges
      skillChanges?: Record<string, number>
    }
  }
  grantsItem?: string
  reserveDelta?: number
  investmentReturn?: number
  investmentDurationDays?: number
}

