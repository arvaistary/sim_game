import type { StatChangeBreakdownEntry, StatChanges } from '@/domain/balance/types'
import type { AgeGroup } from '@/domain/balance/actions/types'

export interface ActionData {
  id: string
  title?: string
  label?: string
  name?: string
  price: number
  hourCost: number
  dayCost?: number
  actionType?: string
  actionSource?: string
  category?: string
  icon?: string | null
  /** Текст для карточек и лога; итоговые дельты = statChanges ± модификаторы/возраст/долг сна (см. calculateStatChanges). */
  effect?: string
  statChanges?: StatChanges
  skillChanges?: Record<string, number>
  oneTime?: boolean
  cooldown?: { hours: number }
  requirements?: {
    minAge?: number
    minSkills?: Record<string, number>
    housingLevel?: number
    requiresItem?: string
    requiresRelationship?: boolean
  }
  housingComfortDelta?: number
  housingUpgradeLevel?: number
  relationshipDelta?: number
  reserveDelta?: number
  subscription?: {
    monthlyCost: number
    effectPerWeek?: {
      statChanges?: StatChanges
      skillChanges?: Record<string, number>
    } | null
  }
  grantsItem?: string
  /** Минимальная возрастная группа для доступа к действию. Если undefined — доступно всем. */
  ageGroup?: AgeGroup
  /** Максимальная возрастная группа. Если указано — действие скрывается при превышении. */
  maxAgeGroup?: AgeGroup
}

export type ActionDenyReason =
  | 'not_found'
  | 'age_group'
  | 'low_energy'
  | 'high_hunger'
  | 'no_money'
  | 'no_time'
  | 'one_time_used'
  | 'cooldown'
  | 'min_age'
  | 'min_skills'
  | 'housing_level'
  | 'requires_item'
  | 'requires_relationship'

export interface AvailabilityCheck {
  available: boolean
  reason?: string
  reasonCode?: ActionDenyReason
}

export interface ExecuteResult {
  success: boolean
  summary?: string
  error?: string
  /** Пошаговый разбор статов для UI (только при success). */
  statBreakdown?: StatChangeBreakdownEntry[]
}
