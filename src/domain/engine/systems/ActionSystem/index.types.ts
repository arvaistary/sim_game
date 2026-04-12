import type { StatChangeBreakdownEntry, StatChanges } from '@/domain/balance/types'

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
}

export interface AvailabilityCheck {
  available: boolean
  reason?: string
}

export interface ExecuteResult {
  success: boolean
  summary?: string
  error?: string
  /** Пошаговый разбор статов для UI (только при success). */
  statBreakdown?: StatChangeBreakdownEntry[]
}
