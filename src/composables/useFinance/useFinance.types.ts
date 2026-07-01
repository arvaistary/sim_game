import type { ComputedRef } from 'vue'
import type { Investment } from '@/stores/finance-store/finance-store.types'

export type InvestmentType = 'deposit' | 'stocks' | 'business'

export interface InvestmentOverview {
  balance: number
  expenses: number
  income: number
}

export type UseFinanceReturn = {
  overview: ComputedRef<InvestmentOverview>
  investments: ComputedRef<Investment[]>
  applyAction: (actionData: Record<string, unknown>) => boolean
  collectInvestment: (portfolioId: string) => boolean
}