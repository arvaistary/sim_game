import type { StatChanges } from '@domain/balance/types'

export interface InitialSaveHousing {
  level: number
  name: string
  comfort: number
  furniture: unknown[]
  lastWeeklyBonus: null
}

export interface InitialSaveEducation {
  school: string
  institute: string
  educationLevel: string
  activeCourses: unknown[]
  completedPrograms?: unknown[]
}

export interface InitialSaveFinance {
  reserveFund: number
  monthlyExpenses: Record<string, number>
  lastMonthlySettlement: null
  debt: number
}

export interface InitialSaveLifetimeStats {
  totalWorkDays: number
  totalWorkHours: number
  totalEvents: number
  totalMicroEvents: number
  maxMoney: number
}

export interface InitialSaveData {
  version: string
  playerName: string
  startAge: number
  currentAge: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  time: Record<string, unknown>
  money: number
  totalEarnings: number
  totalSpent: number
  currentJob: null
  housing: InitialSaveHousing
  skills: Record<string, number>
  education: InitialSaveEducation
  relationships: unknown[]
  investments: unknown[]
  skillModifiers: Record<string, number>
  finance: InitialSaveFinance
  eventHistory: unknown[]
  pendingEvents: unknown[]
  lifetimeStats: InitialSaveLifetimeStats
  stats: StatChanges
}
