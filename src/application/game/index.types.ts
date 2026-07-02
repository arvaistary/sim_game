import type { Investment } from '@/stores/finance-store'
import type { CanStartEducationResult } from '@/stores/game.store.types'

export type { CanStartEducationResult }

export interface EventChoiceInput {
  eventId: string
  choiceId: string
}

export interface ExecuteActionCommandResult {
  success: boolean
  message: string
}

export interface JobCatalogEntry {
  name: string
  salaryPerHour: number
  requiredHoursPerWeek: number
}

export interface ProgramCatalogEntry {
  name: string
  duration: number
  cost: number
}

export interface ActionRequirements {
  minAge?: number
  minSkills?: Record<string, number>
}

export interface FinanceSnapshotDto {
  money: number
  reserveFund: number
  monthlyIncome: number
  monthlyExpenses: Record<string, number>
  emergencyFund: number
  deposits: Investment[]
  portfolios: Investment[]
}

export interface FinanceOverviewDto {
  balance: number
  expenses: number
  income: number
}
