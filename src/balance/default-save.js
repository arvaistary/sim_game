/** Демо-сейв для ECS-сцен и тестов. Базовые значения при merge загрузки — в `game-state.js` (DEFAULT_SAVE). */
export const DEFAULT_SAVE = {
  version: '0.2.0',
  playerName: 'Алексей',
  startAge: 23,
  currentAge: 24,
  gameDays: 146,
  gameWeeks: 20,
  gameMonths: 5,
  gameYears: 0.4,
  money: 68450,
  totalEarnings: 68450,
  totalSpent: 0,
  currentJob: {
    id: 'office_employee',
    name: 'Офисный сотрудник',
    schedule: '5/2',
    salaryPerWeek: 42000,
    salaryPerDay: 8400,
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
  eventHistory: [],
  pendingEvents: [],
  lifetimeStats: {
    totalWorkDays: 0,
    totalEvents: 0,
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
};

/** Алиас для тестов и сценариев, ожидающих объектное имя сохранения. */
export const defaultSaveData = DEFAULT_SAVE;
