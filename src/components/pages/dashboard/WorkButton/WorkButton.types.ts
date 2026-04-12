export interface WorkSnapshot {
  id: string | null
  name: string
  schedule: string
  employed: boolean
  salaryPerHour: number
  salaryPerDay: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
}

export interface WorkOptions {
  jobName: string
  schedule: string
  dailyHours: number
  oneDayHours: number
  fullShiftHours: number
  requiredHoursPerWeek: number
  workedHoursCurrentWeek: number
  remainingHoursCurrentWeek: number
}

export type WorkStatKey = 'money' | 'energy' | 'hunger' | 'stress' | 'mood' | 'health' | 'physical' | 'workedHoursCurrentWeek'

export interface WorkStatSnapshot {
  money: number
  energy: number
  hunger: number
  stress: number
  mood: number
  health: number
  physical: number
  workedHoursCurrentWeek: number
}

export interface WorkStatDefinition {
  key: WorkStatKey
  label: string
}

export interface WorkStatDiff {
  key: WorkStatKey
  label: string
  before: number
  after: number
  delta: number
}
