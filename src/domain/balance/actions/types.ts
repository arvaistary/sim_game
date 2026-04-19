import type { ActionCategory, StatChanges } from '@/domain/balance/types'

/**
 * Возрастная группа персонажа.
 * Определяет доступные действия, события и ограничения.
 */
export enum AgeGroup {
  INFANT = 0,   // 0-3 года
  TODDLER = 1,  // 4-7 лет
  CHILD = 2,    // 8-12 лет
  KID = 3,      // НЕ ИСПОЛЬЗУЕТСЯ в маппинге
  TEEN = 4,     // 13-15 лет
  YOUNG = 5,    // 16-18 лет
  ADULT = 6,    // 19+ лет
}

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
  /** Изменения ежемесячных расходов (для finance действий) */
  monthlyExpenseDelta?: Record<string, number>
  /** Минимальная возрастная группа для доступа к действию. Если undefined — доступно всем. */
  ageGroup?: AgeGroup
  /** Максимальная возрастная группа для доступа к действию. Если undefined — без верхнего ограничения. */
  maxAgeGroup?: AgeGroup
}

