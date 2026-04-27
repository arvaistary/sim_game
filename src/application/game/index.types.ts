export interface FinanceOverviewDto {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: number
  emergencyFund: number
  deposits: number[]
}

export interface EventChoiceInput {
  eventId: string
  choiceId: string
}

export interface ExecuteActionCommandResult {
  success: boolean
  message: string
}

export interface ChangeCareerResult {
  success: boolean
  message: string
}

export interface CanExecuteActionQueryResult {
  canExecute: boolean
  reason?: string
}

export interface CanStartEducationQueryResult {
  ok: boolean
  reason?: string
}

export interface FinanceOverviewQueryResult {
  balance: number
  expenses: number
  income: number
}

export interface FinanceSnapshotQueryResult {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: Record<string, number>
  emergencyFund: number
  deposits: number[]
  portfolios: unknown[]
}

export interface WorkShiftResult {
  success: boolean
  message: string
  salary: number
}

export interface InvestActionResult {
  success: boolean
  message: string
}

export type { SaveRepository } from './ports/SaveRepository.types'

export interface SleepActionResult {
  energy: number
  message: string
}

export interface MonthlyExpenseEntry {
  category: string
  amount: number
}
