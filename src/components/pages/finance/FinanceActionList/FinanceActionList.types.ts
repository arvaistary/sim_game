import type { LegacyFinanceAction } from '@/domain/balance/types'

export interface FinanceActionItem extends LegacyFinanceAction {
  available?: boolean
  reason?: string
}
