import { INITIAL_SAVE, INITIAL_TIME_TEMPLATE } from '@domain/balance/constants/initial-save'
/**
 * Полный сейв для тестового забега: персонаж сразу взрослый (25 лет)
 * с базовыми деньгами, навыками и работой.
 */
export function buildAdultGameSavePayload(input: {
  playerName: string
}): Record<string, unknown> {
  const age: number = 25
  const base= structuredClone(INITIAL_SAVE) as unknown as Record<string, unknown>

  // Базовые навыки на среднем уровне
  const skills: Record<string, number> = {
    professionalism: 30,
    communication: 25,
    timeManagement: 20,
    healthyLifestyle: 15,
    financialLiteracy: 20,
    stressResistance: 25,
  }

  const time = {
    ...structuredClone(INITIAL_TIME_TEMPLATE),
    startAge: age,
    currentAge: age,
  }

  // Стартовые деньги для тестового забега
  const money: number = 50000
  
  const lifetimeStats = {
    ...(base.lifetimeStats as Record<string, unknown>),
    maxMoney: money,
  }

  // Базовое образование
  const education = {
    school: 'high',
    institute: 'none',
    educationLevel: 'Среднее',
    activeCourses: [],
    completedPrograms: [],
  }

  // Базовая работа
  const currentJob = {
    jobId: 'junior_office',
    level: 1,
    hoursWorkedToday: 0,
    hoursWorkedThisWeek: 0,
    hoursWorkedThisMonth: 0,
  }

  // Улучшенное жилье
  const housing = {
    level: 1,
    name: 'Квартира',
    comfort: 30,
    furniture: [],
    lastWeeklyBonus: null,
  }

  // Немного финансов
  const finance = {
    reserveFund: 10000,
    monthlyExpenses: {
      housing: 15000,
      food: 8000,
      transport: 3000,
      leisure: 4000,
      education: 0,
    },
    lastMonthlySettlement: null,
    debt: 0,
  }

  return {
    ...base,
    playerName: input.playerName.trim(),
    startAge: age,
    currentAge: age,
    currentJob,
    skills,
    education,
    money,
    time,
    lifetimeStats,
    housing,
    finance,
  }
}
