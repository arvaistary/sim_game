import type { LegacyFinanceAction } from '@/domain/balance/types'

export interface FinanceOverview {
  liquidMoney: number
  reserveFund: number
  investedTotal: number
  expectedReturnTotal: number
  monthlyIncome: number
  monthlyExpensesTotal: number
  monthlyBalance: number
  expenseLines: Array<{ id: string; label: string; amount: number }>
  investments: Array<Record<string, unknown>>
  lastMonthlySettlement: Record<string, unknown> | null
}

export interface FinanceActionResult {
  success: boolean
  message: string
}

export interface FinanceActionWithAvailability extends LegacyFinanceAction {
  available: boolean
  reason: string
}
