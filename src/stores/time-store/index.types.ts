export interface TimeState {
  totalHours: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  sleepDebt: number
}

export interface TimeStore {
  totalHours: number
  sleepDebt: number
  startAge: number
  gameDays: number
  gameWeeks: number
  gameMonths: number
  gameYears: number
  currentAge: number
  dayHour: number
  dayHoursRemaining: number
  weekHour: number
  weekHoursRemaining: number
  gameWeeksFloored: number
  advanceHours: (hours: number, options?: { actionType?: 'sleep' | 'work' | 'default' }) => void
  advanceHoursWithSleep: (hours: number, sleepHours: number) => void
  reduceSleepDebt: (amount: number) => void
  setTotalHours: (hours: number) => void
  reset: () => void
  save: () => Record<string, unknown>
  load: (data: Record<string, unknown>) => void
}
