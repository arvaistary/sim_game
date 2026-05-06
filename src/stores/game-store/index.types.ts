import type { ActiveEducation, CompletedProgram } from '../education-store'
import type { EducationLevel } from '../education-store'
import type { FurnitureItem } from '../housing-store'
export interface QuitCareerResult {
  success: boolean
  message: string
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

export interface NewGameSeed {
  playerName: string
  startAge: number
}

export type { GameSessionSnapshot } from '@application/game'
