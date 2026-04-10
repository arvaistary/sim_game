/**
 * Демо-сейв для ECS-сцен и тестов
 * Старт новой игры: initial-save.js → legacy DEFAULT_SAVE в game-state.js
 */

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

export interface EducationData {
  school: string
  institute: string
  educationLevel: string
  activeCourses: unknown[]
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

export const DEFAULT_SAVE: SaveData = {
  version: '1.1.0',
  playerName: 'Алексей',
  startAge: 23,
  currentAge: 24,
  gameDays: 146,
  gameWeeks: 20,
  gameMonths: 5,
  gameYears: 0.4,
  time: {
    totalHours: 3504,
    hourOfDay: 0,
    dayOfWeek: 7,
    weekHoursSpent: 144,
    weekHoursRemaining: 24,
    dayHoursSpent: 0,
    dayHoursRemaining: 24,
    sleepHoursToday: 0,
    sleepDebt: 0,
  },
  money: 68450,
  totalEarnings: 68450,
  totalSpent: 0,
  currentJob: {
    id: 'office_employee',
    name: 'Офисный сотрудник',
    schedule: '5/2',
    employed: true,
    salaryPerHour: 1050,
    salaryPerWeek: 42000,
    salaryPerDay: 8400,
    requiredHoursPerWeek: 40,
    workedHoursCurrentWeek: 0,
    totalWorkedHours: 1168,
    level: 1,
    daysAtWork: 146,
  },
  housing: {
    level: 1,
    name: 'Студия',
    comfort: 35,
    furniture: [],
    lastWeeklyBonus: null,
  },
  skills: {
    professionalism: 2,
    communication: 2,
    timeManagement: 2,
    healthyLifestyle: 1,
    financialLiteracy: 1,
    stressResistance: 1,
  },
  skillModifiers: {
    hungerDrainMultiplier: 1,
    energyDrainMultiplier: 1,
    stressGainMultiplier: 1,
    moodRecoveryMultiplier: 1,
    healthDecayMultiplier: 1,
    salaryMultiplier: 1,
    workEfficiencyMultiplier: 1,
    shopPriceMultiplier: 1,
    investmentReturnMultiplier: 1,
    learningSpeedMultiplier: 1,
    homeComfortMultiplier: 1,
    dailyExpenseMultiplier: 1,
    positiveEventChanceBonus: 0,
    negativeEventPenaltyReduction: 0,
    relationshipGainMultiplier: 1,
    hobbyIncomeMultiplier: 1,
    passiveIncomeBonus: 0,
    maxEnergyBonus: 0,
    agingSpeedMultiplier: 1,
    foodRecoveryMultiplier: 1,
    promotionChanceBonus: 0,
    allRecoveryMultiplier: 1,
    healthRecoveryMultiplier: 1,
    eventChoiceHintBonus: 0,
    autoRecoveryWeekly: 0,
  },
  education: {
    school: 'completed',
    institute: 'none',
    educationLevel: 'Среднее',
    activeCourses: [],
  },
  relationships: [
    {
      id: 'friend_ivan',
      name: 'Иван',
      type: 'friend',
      level: 42,
      lastContact: 142,
    },
  ],
  investments: [],
  finance: {
    reserveFund: 18000,
    monthlyExpenses: {
      housing: 16000,
      food: 9000,
      transport: 4500,
      leisure: 6500,
      education: 2500,
    },
    lastMonthlySettlement: null,
  },
  eventState: {
    cooldownByEventId: {},
    lastWeeklyEventWeek: 19,
    lastMonthlyEventMonth: 4,
    lastYearlyEventYear: 0,
  },
  eventHistory: [],
  pendingEvents: [],
  lifetimeStats: {
    totalWorkDays: 0,
    totalWorkHours: 0,
    totalEvents: 0,
    totalMicroEvents: 0,
    maxMoney: 68450,
  },
  stats: {
    hunger: 64,
    energy: 57,
    stress: 42,
    mood: 73,
    health: 81,
    physical: 49,
  },
}

/** Алиас для тестов и сценариев */
export const defaultSaveData = DEFAULT_SAVE

