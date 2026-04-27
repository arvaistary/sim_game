import type { CharacterTag } from '../types'

export interface SaveData {
  version: string
  playerName: string
  startAge: number
  currentAge: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  time: TimeData
  money: number
  totalEarnings: number
  totalSpent: number
  currentJob: JobData
  housing: HousingData
  skills: Record<string, number>
  skillModifiers: Record<string, number>
  education: EducationData
  relationships: RelationshipData[]
  investments: unknown[]
  finance: FinanceData
  eventState: EventStateData
  eventHistory: unknown[]
  pendingEvents: unknown[]
  lifetimeStats: LifetimeStatsData
  stats: StatsData
  tags?: { items: CharacterTag[] }
}

export interface TimeData {
  totalHours: number
  hourOfDay: number
  dayOfWeek: number
  weekHoursSpent: number
  weekHoursRemaining: number
  dayHoursSpent: number
  dayHoursRemaining: number
  sleepHoursToday: number
  sleepDebt: number
}

export interface JobData {
  id: string
  name: string
  schedule: string
  employed: boolean
  salaryPerHour: number
  salaryPerWeek: number
  salaryPerDay: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  totalWorkedHours: number
  level: number
  daysAtWork: number
}

export interface HousingData {
  level: number
  name: string
  comfort: number
  furniture: unknown[]
  lastWeeklyBonus: number | null
}

export interface CompletedProgram {
  id: string
  name: string
  typeLabel?: string
  completedAtGameDay?: number
}

export interface EducationData {
  school: string
  institute: string
  educationLevel: string
  activeCourses: unknown[]
  completedPrograms?: CompletedProgram[]
}

export interface RelationshipData {
  id: string
  name: string
  type: string
  level: number
  lastContact: number
}

export interface FinanceData {
  reserveFund: number
  monthlyExpenses: Record<string, number>
  lastMonthlySettlement: number | null
  debt: number
}

export interface EventStateData {
  cooldownByEventId: Record<string, number>
  lastWeeklyEventWeek: number
  lastMonthlyEventMonth: number
  lastYearlyEventYear: number
}

export interface LifetimeStatsData {
  totalWorkDays: number
  totalWorkHours: number
  totalEvents: number
  totalMicroEvents: number
  maxMoney: number
}

export interface StatsData {
  hunger: number
  energy: number
  stress: number
  mood: number
  health: number
  physical: number
}