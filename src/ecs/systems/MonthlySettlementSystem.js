import { 
  WALLET_COMPONENT,
  FINANCE_COMPONENT,
  STATS_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { MONTHLY_EXPENSES_DEFAULT } from '../../balance/monthly-expenses-defaults.js';
import { SkillsSystem } from './SkillsSystem.js';

/**
 * Система месячного расчета
 * Обрабатывает ежемесячные расходы и финансы
 */
export class MonthlySettlementSystem {
  constructor() {
    this.monthlyExpensesDefault = { ...MONTHLY_EXPENSES_DEFAULT };
  }

  init(world) {
    this.world = world;
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);
  }

  /**
   * Выполнить месячный расчёт
   */
  applyMonthlySettlement(monthNumber) {
    const playerId = PLAYER_ENTITY;
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    const time = this.world.getComponent(playerId, TIME_COMPONENT);

    if (!wallet || !finance) {
      return { success: false, message: 'Не удалось загрузить финансовые данные' };
    }

    const modifiers = this.skillsSystem.getModifiers();
    const monthlyExpenses = finance.monthlyExpenses || { ...this.monthlyExpensesDefault };
    const monthlyTotalBase = Object.values(monthlyExpenses).reduce((sum, value) => sum + value, 0);
    const monthlyTotal = Math.max(
      0,
      Math.round(monthlyTotalBase * (modifiers.dailyExpenseMultiplier ?? 1)) - Math.round(modifiers.passiveIncomeBonus ?? 0),
    );

    // Списываем деньги
    const liquidPaid = Math.min(wallet.money, monthlyTotal);
    wallet.money -= liquidPaid;

    // Из резерва
    const remaining = monthlyTotal - liquidPaid;
    const reservePaid = Math.min(finance.reserveFund ?? 0, remaining);
    finance.reserveFund = Math.max(0, (finance.reserveFund ?? 0) - reservePaid);

    // Дефицит
    const shortage = Math.max(0, remaining - reservePaid);
    wallet.totalSpent += monthlyTotal - shortage;

    // Применяем штрафы при дефиците
    if (shortage > 0) {
      if (stats) {
        this._applyStatChanges(stats, {
          stress: Math.min(18, 8 + Math.round(shortage / 10000)),
          mood: -Math.min(16, 6 + Math.round(shortage / 12000)),
          health: -Math.min(10, 3 + Math.round(shortage / 18000)),
        });
      }

      // Создаем событие дефицита
      const cashGapEvent = {
        id: 'finance_cash_gap',
        type: 'emergency',
        title: 'Кассовый разрыв месяца',
        description: 'Обязательные расходы съели почти всё. Нужно быстро решить, откуда взять воздух на следующий цикл.',
        choices: [
          {
            label: 'Переложить из резерва',
            outcome: 'Ты закрыл дыру за счёт подушки и немного снизил давление.',
            statChanges: { stress: -3 },
          },
          {
            label: 'Сократить жильё',
            outcome: 'Решение неприятное, но бюджет станет заметно легче уже со следующего месяца.',
            statChanges: { mood: -8, stress: 4 },
            housingLevelDelta: -1,
          },
        ],
      };
      this._queuePendingEvent(cashGapEvent);
    } else if (reservePaid > 0 && stats) {
      // Небольшой стресс от использования резерва
      this._applyStatChanges(stats, {
        stress: -3,
        mood: 2,
      });
    }

    // Сохраняем результат расчета
    finance.lastMonthlySettlement = {
      month: monthNumber,
      totalCharged: monthlyTotal,
      liquidPaid,
      reservePaid,
      shortage,
      liquidAfter: wallet.money,
      reserveAfter: finance.reserveFund,
    };

    // Проверяем уровень резерва и создаем предупреждение если нужно
    if ((finance.reserveFund ?? 0) < monthlyTotal * 0.35) {
      const reserveWarningEvent = {
        id: 'finance_reserve_warning',
        type: 'emergency',
        title: 'Резерв почти закончился',
        description: 'Подушка стала слишком тонкой. Пора решить, что важнее: срочно ужаться по тратам или удержать привычный ритм.',
        choices: [
          {
            label: 'Жёстко урезать досуг',
            outcome: 'Ты быстро стабилизировал бюджет, но настроение просело.',
            statChanges: { stress: -4, mood: -6 },
            skillChanges: { financialLiteracy: 1 },
            monthlyExpenseDelta: { leisure: -2000 },
          },
          {
            label: 'Оставить как есть',
            outcome: 'Комфорт сохранился, но тревога о деньгах стала сильнее.',
            statChanges: { stress: 8, mood: -2 },
          },
        ],
      };
      this._queuePendingEvent(reserveWarningEvent);
    }

    // Логирование месячного расчёта
    if (this.world && this.world.eventBus) {
      const time = this.world.getComponent(playerId, TIME_COMPONENT);
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:finance', {
        detail: {
          category: 'monthly_settlement',
          title: '📅 Месячный расчёт',
          description: `Доход: $0, Расходы: $${this._formatMoney(monthlyTotal)}, Баланс: $${this._formatMoney(wallet.money)}`,
          icon: null,
          metadata: {
            income: 0,
            expenses: monthlyTotal,
            balance: wallet.money,
            month: monthNumber,
            year: time ? Math.floor((time.gameMonths ?? 0) / 12) : 0,
          },
        },
      }));
    }

    const message = [
      `Месяц ${monthNumber} закрыт.`,
      `Списано: ${this._formatMoney(liquidPaid)} ₽ (личные) + ${this._formatMoney(reservePaid)} ₽ (резерв).`,
      `Дефицит: ${shortage > 0 ? this._formatMoney(shortage) + ' ₽' : 'нет'}`,
    ].join('\n');

    return { success: true, message };
  }

  /**
   * Добавить событие в очередь
   */
  _queuePendingEvent(event) {
    const playerId = PLAYER_ENTITY;
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventQueue || !eventHistory) {
      return;
    }

    // Проверяем, не было ли событие уже обработано
    const instanceId = `${event.id}_${Date.now()}`;
    const alreadyHandled = (eventHistory.events || []).some(item => item.eventId === instanceId);
    const alreadyQueued = (eventQueue.pendingEvents || []).some(item => item.instanceId === instanceId);

    if (alreadyHandled || alreadyQueued) {
      return;
    }

    // Добавляем событие в очередь
    if (!eventQueue.pendingEvents) {
      eventQueue.pendingEvents = [];
    }
    eventQueue.pendingEvents.push({ ...event, instanceId });
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
