export interface RuntimeTimeComponent {
  totalHours: number
  hourOfDay: number
  dayOfWeek: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  startAge: number
  weekHoursSpent: number
  weekHoursRemaining: number
  dayHoursSpent: number
  dayHoursRemaining: number
  sleepHoursToday: number
  sleepDebt: number
  eventState: {
    cooldownByEventId: Record<string, number>
    lastWeeklyEventWeek: number
    lastMonthlyEventMonth: number
    lastYearlyEventYear: number
  }
}

export interface AdvanceOptions {
  sleepHours?: number
  actionType?: string
  riskMultiplier?: number
}

export interface AdvanceResult {
  weekly: number[]
  monthly: number[]
  yearly: number[]
  age: number[]
}

export type PeriodicCallback = (...args: number[]) => void
