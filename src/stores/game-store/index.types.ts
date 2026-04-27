import type { EducationLevel, ActiveEducation, CompletedProgram } from '../education-store'
import type { FurnitureItem } from '../housing-store'
import type { MonthlyExpense } from '../finance-store'

export interface QuitCareerResult {
  success: boolean
  message: string
}

export interface CanStartProgramResult {
  ok: boolean
  reason?: string
}

export interface CanExecuteActionResult {
  canDo: boolean
  canExecute: boolean
  reason: string | undefined
}

export interface TimeSnapshot {
  totalHours: number
  gameDays: number
  gameWeeks: number
  currentAge: number
  sleepDebt: number
  weekHoursRemaining: number
}

export interface StatsSnapshot {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
  physical: number
}

export interface WalletSnapshot {
  money: number
  reserveFund: number
  totalEarned: number
  totalSpent: number
}

export interface EducationSnapshot {
  educationLevel: EducationLevel
  school: string
  institute: string
  cognitiveLoad: number
  activeCourses: ActiveEducation[]
  completedPrograms: CompletedProgram[]
}

export interface HousingSnapshot {
  level: number
  comfort: number
  furniture: FurnitureItem[]
}

export interface CanApplyWorkShiftResult {
  canDo: boolean
  reason?: string
}

export interface CareerTrackEntry {
  id: string
  name: string
  level: number
  schedule: string
  salaryPerHour: number
  current?: boolean
  unlocked?: boolean
  missingProfessionalism?: number
  educationRequiredLabel?: string
}

export interface ActionRequirements {
  minAge?: number
  minSkills?: Record<string, number>
}

export interface FinanceOverview {
  balance: number
  expenses: number
  income: number
}

export interface StatsShortSnapshot {
  energy: number
  health: number
  hunger: number
  stress: number
  mood: number
}

export interface FinanceSnapshot {
  monthlyExpenses: MonthlyExpense[]
}

export interface NewGameSeed {
  playerName: string
  startAge: number
}
