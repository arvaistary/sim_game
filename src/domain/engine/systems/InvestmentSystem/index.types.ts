export interface InvestmentConfig {
  id?: string
  type?: string
  label: string
  amount: number
  durationDays?: number
  expectedReturn?: number
}

export interface InvestmentRecord {
  id: string
  type: string
  label: string
  amount: number
  startDate: number
  durationDays: number
  maturityDay: number
  expectedReturn: number
  totalEarned: number
  status: string
  closedAt?: number
}

export interface InvestmentWithState extends InvestmentRecord {
  state: string
  maturityDay: number
  daysLeft: number
  payoutAmount: number
}

export interface InvestmentResult {
  success: boolean
  message: string
  investment?: InvestmentRecord
}
