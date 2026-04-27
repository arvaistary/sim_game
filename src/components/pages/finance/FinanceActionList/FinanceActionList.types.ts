import type { LegacyFinanceAction } from '@domain/balance/types'

/** Элемент финансового действия с полями доступности и эффекта. */
export interface FinanceActionItem extends LegacyFinanceAction {
  available?: boolean
  reason?: string
  effect?: string
}
