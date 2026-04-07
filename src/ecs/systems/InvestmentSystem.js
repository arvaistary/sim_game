import { 
  WALLET_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

/**
 * Система управления инвестициями
 * Обрабатывает открытие, отслеживание и закрытие вкладов
 */
export class InvestmentSystem {
  constructor() {
    this.investments = [];
  }

  init(world) {
    this.world = world;
  }

  /**
   * Открыть новую инвестицию
   */
  openInvestment(config) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const investments = this.world.getComponent(playerId, 'investment') || [];

    if (!time) {
      return { success: false, message: 'Не удалось загрузить время игры' };
    }

    const durationDays = config.durationDays ?? 28;
    const newInvestment = {
      id: config.id || `deposit_${investments.length + 1}`,
      type: config.type || 'deposit',
      label: config.label,
      amount: config.amount,
      startDate: time.gameDays,
      durationDays,
      maturityDay: time.gameDays + durationDays,
      expectedReturn: config.expectedReturn ?? 0,
      totalEarned: 0,
      status: 'active',
    };

    investments.push(newInvestment);
    this.world.updateComponent(playerId, 'investment', investments);

    return { 
      success: true, 
      message: `Инвестиция "${config.label}" открыта на ${this._formatMoney(config.amount)} ₽.`,
      investment: newInvestment 
    };
  }

  /**
   * Собрать доход с инвестиции
   */
  collectInvestment(investmentId) {
    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const investments = this.world.getComponent(playerId, 'investment') || [];

    if (!wallet || !time) {
      return { success: false, message: 'Не удалось загрузить данные' };
    }

    const investment = investments.find(item => item.id === investmentId);
    if (!investment) {
      return { success: false, message: 'Инвестиция не найдена' };
    }

    const state = this._getInvestmentState(investment, time.gameDays);
    if (state === 'closed') {
      return { success: false, message: 'Эта инвестиция уже закрыта.' };
    }

    if (state !== 'matured') {
      const maturityDay = investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28));
      const daysLeft = Math.max(0, maturityDay - time.gameDays);
      return { success: false, message: `Пока рано. До закрытия вклада осталось ${daysLeft} д.` };
    }

    const payoutAmount = (investment.amount ?? 0) + (investment.expectedReturn ?? 0);
    wallet.money += payoutAmount;
    wallet.totalEarnings += investment.expectedReturn ?? 0;
    investment.totalEarned = (investment.totalEarned ?? 0) + (investment.expectedReturn ?? 0);
    investment.closedAt = time.gameDays;
    investment.status = 'closed';

    // Сохраняем обновленный список инвестиций
    this.world.updateComponent(playerId, 'investment', investments);

    return { 
      success: true, 
      message: [
        `${investment.label || 'Инвестиция'} закрыта.`,
        `Возвращено ${this._formatMoney(payoutAmount)} ₽, из них доход ${this._formatMoney(investment.expectedReturn ?? 0)} ₽.`,
      ].join('\n')
    };
  }

  /**
   * Получить все инвестиции
   */
  getAllInvestments() {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const investments = this.world.getComponent(playerId, 'investment') || [];

    if (!time) {
      return [];
    }

    return investments.map((investment) => {
      const state = this._getInvestmentState(investment, time.gameDays);
      return {
        ...investment,
        state,
        maturityDay: investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28)),
        daysLeft: Math.max(0, (investment.maturityDay ?? ((investment.startDate ?? 0) + (investment.durationDays ?? 28))) - time.gameDays),
        payoutAmount: (investment.amount ?? 0) + (investment.expectedReturn ?? 0),
      };
    });
  }

  /**
   * Получить активные инвестиции
   */
  getActiveInvestments() {
    const allInvestments = this.getAllInvestments();
    return allInvestments.filter(investment => investment.state !== 'closed');
  }

  /**
   * Получить созревшие инвестиции
   */
  getMaturedInvestments() {
    const allInvestments = this.getAllInvestments();
    return allInvestments.filter(investment => investment.state === 'matured');
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
   * Форматирование денег
   */
  _formatMoney(value) {
    return new Intl.NumberFormat('ru-RU').format(value);
  }
}
