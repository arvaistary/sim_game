import type { BalanceAction } from '@/domain/balance/actions'

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

export interface FinanceActionWithAvailability extends BalanceAction {
  available: boolean
  reason: string
  // Дополнительные поля для UI совместимости
  subtitle?: string
  amount?: number
  dayCost?: number
  accentKey?: string
  description?: string
}
