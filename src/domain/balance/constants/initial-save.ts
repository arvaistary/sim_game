import type { StatChanges } from '@/domain/balance/types'
import { createBaseSkillModifiers } from '@/domain/balance/constants/skill-modifiers'

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
  housing: {
    level: number
    name: string
    comfort: number
    furniture: unknown[]
    lastWeeklyBonus: null
  }
  skills: Record<string, number>
  education: {
    school: string
    institute: string
    educationLevel: string
    activeCourses: unknown[]
  }
  relationships: unknown[]
  investments: unknown[]
  skillModifiers: Record<string, number>
  finance: {
    reserveFund: number
    monthlyExpenses: Record<string, number>
    lastMonthlySettlement: null
  }
  eventHistory: unknown[]
  pendingEvents: unknown[]
  lifetimeStats: {
    totalWorkDays: number
    totalWorkHours: number
    totalEvents: number
    totalMicroEvents: number
    maxMoney: number
  }
  stats: StatChanges
}

/** Игровое время в начале новой игры (день 0); возраст задаётся в buildNewGameSavePayload. */
export const INITIAL_TIME_TEMPLATE: Record<string, unknown> = {
  totalHours: 0,
  hourOfDay: 0,
  dayOfWeek: 1,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  currentAge: 18,
  startAge: 18,
  weekHoursSpent: 0,
  weekHoursRemaining: 168,
  dayHoursSpent: 0,
  dayHoursRemaining: 24,
  sleepHoursToday: 0,
  sleepDebt: 0,
  eventState: {
    cooldownByEventId: {},
    lastWeeklyEventWeek: 0,
    lastMonthlyEventMonth: 0,
    lastYearlyEventYear: 0,
  },
}

export const INITIAL_SAVE: InitialSaveData = {
  version: '1.1.0',
  playerName: '',
  startAge: 18,
  currentAge: 18,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
  time: { ...INITIAL_TIME_TEMPLATE },
  money: 5000,
  totalEarnings: 0,
  totalSpent: 0,
  currentJob: null,
  housing: {
    level: 0,
    name: 'Комната',
    comfort: 0,
    furniture: [],
    lastWeeklyBonus: null,
  },
  skills: {
    professionalism: 0,
    communication: 0,
    timeManagement: 0,
    healthyLifestyle: 0,
    financialLiteracy: 0,
    stressResistance: 0,
  },
  education: {
    school: 'none',
    institute: 'none',
    educationLevel: 'Нет',
    activeCourses: [],
  },
  relationships: [],
  investments: [],
  skillModifiers: createBaseSkillModifiers() as unknown as Record<string, number>,
  finance: {
    reserveFund: 0,
    monthlyExpenses: {
      housing: 0,
      food: 0,
      transport: 0,
      leisure: 0,
      education: 0,
    },
    lastMonthlySettlement: null,
  },
  eventHistory: [],
  pendingEvents: [],
  lifetimeStats: {
    totalWorkDays: 0,
    totalWorkHours: 0,
    totalEvents: 0,
    totalMicroEvents: 0,
    maxMoney: 0,
  },
  stats: {
    hunger: 80,
    energy: 80,
    stress: 20,
    mood: 70,
    health: 90,
    physical: 70,
  },
}

