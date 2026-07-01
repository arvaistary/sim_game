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
