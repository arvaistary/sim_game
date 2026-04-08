import { 
  CAREER_COMPONENT,
  TIME_COMPONENT,
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  SKILLS_COMPONENT,
  STATS_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

const FINANCE_ACTIONS = [
  {
    id: 'reserve_transfer',
    title: 'Пополнить резерв',
    subtitle: 'Переложить часть свободных денег в финансовую подушку.',
    amount: 10000,
    reserveDelta: 10000,
    dayCost: 1,
    statChanges: { stress: -10, mood: 4 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: 'sage',
    description: 'Ликвидные деньги -10 000 ₽ • Резерв +10 000 ₽ • Стресс -10',
  },
  {
    id: 'open_deposit',
    title: 'Открыть вклад',
    subtitle: 'Заморозить капитал на 28 дней ради спокойного дохода.',
    amount: 50000,
    expectedReturn: 4000,
    durationDays: 28,
    dayCost: 1,
    statChanges: { stress: -4, mood: 3 },
    skillChanges: { financialLiteracy: 1 },
    accentKey: 'blue',
    description: 'Ликвидные деньги -50 000 ₽ • Через 28 дней можно забрать 54 000 ₽',
  },
  {
    id: 'budget_review',
    title: 'Пересобрать бюджет',
    subtitle: 'Чуть снизить тревогу и подправить ежемесячные траты.',
    amount: 0,
    dayCost: 1,
    statChanges: { stress: -8, mood: 5 },
    skillChanges: { financialLiteracy: 1 },
    monthlyExpenseDelta: {
      leisure: -1000,
      education: 500,
    },
    accentKey: 'accent',
    description: 'Стресс -8 • Финансовая грамотность +1 • Расходы на досуг -1 000 ₽/мес',
  },
];

/**
 * Система финансовых действий
 * Обрабатывает управление резервом, депозитами и бюджетом
 */
export class FinanceActionSystem {
  constructor() {
    this.financeActions = FINANCE_ACTIONS;
  }

  init(world) {
    this.world = world;
  }

  /**
   * Получить обзор финансов
   */
  getFinanceOverview() {
    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const rawInvestments = this.world.getComponent(playerId, 'investment');
    const investments = Array.isArray(rawInvestments) ? rawInvestments : [];

    if (!wallet || !finance || !time) {
      return null;
    }

    const monthlyExpenses = finance.monthlyExpenses || {
      housing: 16000,
      food: 9000,
      transport: 4500,
      leisure: 6500,
      education: 2500,
    };

    const expenseLines = [
      { id: 'housing', label: 'Жильё', amount: monthlyExpenses.housing ?? 0 },
      { id: 'food', label: 'Еда', amount: monthlyExpenses.food ?? 0 },
      { id: 'transport', label: 'Транспорт', amount: monthlyExpenses.transport ?? 0 },
      { id: 'leisure', label: 'Досуг', amount: monthlyExpenses.leisure ?? 0 },
      { id: 'education', label: 'Обучение', amount: monthlyExpenses.education ?? 0 },
    ];

    const monthlyExpensesTotal = expenseLines.reduce((sum, item) => sum + item.amount, 0);
    const career = this.world.getComponent(playerId, CAREER_COMPONENT);
    const monthlyIncome = (career?.salaryPerWeek ?? 0) * 4;
    const reserveFund = finance.reserveFund ?? 0;

    const activeInvestments = investments.map((investment) => {
      const state = this._getInvestmentState(investment, time.gameDays);
      return {
        ...investment,
        state,
        maturityDay: investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28)),
        daysLeft: Math.max(0, (investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))) - time.gameDays),
        payoutAmount: (investment.amount ?? 0) + (investment.expectedReturn ?? 0),
      };
    });

    const investedTotal = activeInvestments
      .filter(item => item.state !== 'closed')
      .reduce((sum, item) => sum + (item.amount ?? 0), 0);

    const expectedReturnTotal = activeInvestments
      .filter(item => item.state !== 'closed')
      .reduce((sum, item) => sum + (item.expectedReturn ?? 0), 0);

    return {
      liquidMoney: wallet.money,
      reserveFund,
      investedTotal,
      expectedReturnTotal,
      monthlyIncome,
      monthlyExpensesTotal,
      monthlyBalance: monthlyIncome - monthlyExpensesTotal,
      expenseLines,
      investments: activeInvestments.filter(item => item.state !== 'closed'),
      lastMonthlySettlement: finance.lastMonthlySettlement ?? null,
    };
  }

  /**
   * Получить доступные финансовые действия
   */
  getFinanceActions() {
    const overview = this.getFinanceOverview();
    if (!overview) {
      return [];
    }

    return this.financeActions.map(action => ({
      ...action,
      available: overview.liquidMoney >= action.amount,
      reason: overview.liquidMoney >= action.amount ? '' : `Нужно ${this._formatMoney(action.amount)} ₽ свободных денег.`,
    }));
  }

  /**
   * Применить финансовое действие
   */
  applyFinanceAction(actionId) {
    const action = this.financeActions.find(item => item.id === actionId);
    if (!action) {
      return { success: false, message: 'Финансовое действие не найдено.' };
    }

    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);

    if (!wallet || !finance) {
      return { success: false, message: 'Не удалось загрузить финансовые данные.' };
    }

    if (wallet.money < action.amount) {
      return { success: false, message: `Недостаточно свободных денег. Нужно ${this._formatMoney(action.amount)} ₽.` };
    }

    if (action.id === 'reserve_transfer') {
      wallet.money -= action.amount;
      finance.reserveFund = Math.max(0, (finance.reserveFund ?? 0) + action.reserveDelta);
    }

    if (action.id === 'open_deposit') {
      wallet.money -= action.amount;
      this._openInvestment(action);
    }

    if (action.id === 'budget_review') {
      Object.entries(action.monthlyExpenseDelta ?? {}).forEach(([key, value]) => {
        const currentValue = finance.monthlyExpenses[key] ?? 0;
        finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
      });
    }

    // Применяем изменения статов
    if (action.statChanges) {
      const stats = this.world.getComponent(playerId, STATS_COMPONENT);
      if (stats) {
        this._applyStatChanges(stats, action.statChanges);
      }
    }

    // Применяем изменения навыков
    if (action.skillChanges) {
      const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
      if (skills) {
        this._applySkillChanges(skills, action.skillChanges);
      }
    }

    // Продвигаем время
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    if (time) {
      time.gameDays += action.dayCost ?? 1;
      time.gameWeeks = Math.max(1, Math.floor(time.gameDays / 7));
      time.gameMonths = Math.max(1, Math.floor(time.gameDays / 30));
      time.gameYears = Number((time.gameDays / 360).toFixed(1));
      time.currentAge = time.startAge + Math.floor(time.gameDays / 360);
    }

    const message = [
      `${action.title} выполнено.`,
      action.description,
      this._summarizeStatChanges(action.statChanges),
    ].filter(Boolean).join('\n');

    return { success: true, message };
  }

  /**
   * Открыть инвестицию
   */
  _openInvestment(action) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const rawInvestments = this.world.getComponent(playerId, 'investment');
    const investments = Array.isArray(rawInvestments) ? rawInvestments : [];

    const newInvestment = {
      id: `deposit_${investments.length + 1}`,
      type: 'deposit',
      label: action.title,
      amount: action.amount,
      startDate: time.gameDays,
      durationDays: action.durationDays ?? 28,
      maturityDay: time.gameDays + (action.durationDays ?? 28),
      expectedReturn: action.expectedReturn ?? 0,
      totalEarned: 0,
      status: 'active',
    };

    investments.push(newInvestment);
    this.world.updateComponent(playerId, 'investment', investments);
  }

  /**
   * Получить состояние инвестиции
   */
  _getInvestmentState(investment, currentDay) {
    if (investment.status === 'closed') {
      return 'closed';
    }

    const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
    if (currentDay >= maturityDay) {
      return 'matured';
    }

    return 'active';
  }

  /**
   * Применить изменения статов
   */
  _applyStatChanges(stats, statChanges = {}) {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value);
    }
  }

  /**
   * Применить изменения навыков
   */
  _applySkillChanges(skills, skillChanges = {}) {
    for (const [key, value] of Object.entries(skillChanges)) {
      skills[key] = this._clamp((skills[key] ?? 0) + value, 0, 10);
    }
  }

  /**
   * Суммировать изменения статов
   */
  _summarizeStatChanges(statChanges = {}) {
    const defs = [
      ['hunger', 'Голод'],
      ['energy', 'Энергия'],
      ['stress', 'Стресс'],
      ['mood', 'Настроение'],
      ['health', 'Здоровье'],
      ['physical', 'Форма'],
    ];

    return defs
      .filter(([key]) => statChanges?.[key])
      .map(([key, label]) => `${label} ${statChanges[key] > 0 ? '+' : ''}${statChanges[key]}`)
      .join(' • ');
  }

  /**
   * Ограничить значение
   */
  _clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Форматирование денег
   */
  _formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }
}
