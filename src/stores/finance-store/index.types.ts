export interface Investment {
  id: string
  type: 'deposit' | 'stocks' | 'business'
  amount: number
  returnRate: number
  startDate: number
}

export interface MonthlyExpense {
  category: string
  amount: number
}

export interface FinanceStore {
  investments: Investment[]
  monthlyExpenses: MonthlyExpense[]
  lastSettlement: number | null
  debt: number
  totalInvestment: number
  totalExpense: number
  totalDebt: number
  canInvest: (amount: number) => boolean
  invest: (type: Investment['type'], amount: number, returnRate: number) => boolean
  divest: (investmentId: string) => number
  calculateMonthlyReturn: () => number
  processMonthlySettlement: () => void
  setExpense: (category: string, amount: number) => void
  takeDebt: (amount: number) => void
  repayDebt: (amount: number) => void
  applyAction: (cardData: Record<string, unknown>) => boolean
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
