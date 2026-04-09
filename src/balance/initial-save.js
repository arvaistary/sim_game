/**
 * Стартовое сохранение новой игры (legacy `game-state`: merge при loadSave, StartScene, resetGame).
 * Не путать с `default-save.js` — там демо-сейв для ECS/отладки.
 */
export const INITIAL_SAVE = {
  version: '0.2.0',
  playerName: '',
  startAge: 18,
  currentAge: 18,
  gameDays: 0,
  gameWeeks: 0,
  gameMonths: 0,
  gameYears: 0,
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
    totalEvents: 0,
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
};
