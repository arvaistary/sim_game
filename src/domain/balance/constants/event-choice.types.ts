import type { SkillCheck, StatChanges } from '@/domain/balance/types'

/**
 * Канонический формат choice для domain, store и контента событий (FR-011).
 */
export interface EventChoiceCanonical {
  id: string
  text: string
  outcome?: string
  /** @deprecated use statChanges/moneyDelta/skillChanges */
  effects?: Record<string, number>
  statChanges?: StatChanges
  moneyDelta?: number
  skillChanges?: Record<string, number>
  salaryMultiplier?: number
  permanentSalaryMultiplier?: number
  skillCheck?: SkillCheck
}
