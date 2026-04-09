import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  STATS_COMPONENT,
  WALLET_COMPONENT,
} from '../components/index.js';

/**
 * Система управления временем
 * Часовая модель времени + триггеры периодов + микро-события.
 */
export class TimeSystem {
  constructor() {
    this.HOURS_IN_DAY = 24;
    this.HOURS_IN_WEEK = 168;
    this.WEEKS_IN_MONTH = 4;
    this.MONTHS_IN_YEAR = 12;
    this.DAYS_IN_AGE_YEAR = 360;

    this.weeklyEventCallbacks = [];
    this.monthlyEventCallbacks = [];
    this.yearlyEventCallbacks = [];
    this.ageEventCallbacks = [];

    this.microEventDefinitions = {
      buy_groceries: {
        id: 'micro_robbery_market',
        baseChance: 0.01,
        title: 'Подозрительные люди у магазина',
        description: 'Возле магазина вас попытались ограбить.',
      },
      default: {
        id: 'micro_street_encounter',
        baseChance: 0.03,
        title: 'Случайная встреча',
        description: 'Небольшое случайное событие в течение дня.',
      },
    };
  }

  init(world) {
    this.world = world;
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
    if (time) {
      this.normalizeTimeComponent(time);
    }
  }

  update() {
    // Время в игре продвигается действиями игрока через advanceHours().
  }

  /**
   * Нормализация часовых и legacy-полей времени.
   */
  normalizeTimeComponent(timeComponent) {
    if (!timeComponent) return;

    if (typeof timeComponent.totalHours !== 'number') {
      const fromLegacyDays = Math.max(0, Number(timeComponent.gameDays ?? 0));
      timeComponent.totalHours = fromLegacyDays * this.HOURS_IN_DAY;
    }

    const totalHours = Math.max(0, Math.floor(timeComponent.totalHours));
    const totalDays = Math.floor(totalHours / this.HOURS_IN_DAY);
    const totalWeeks = Math.max(1, Math.floor(totalHours / this.HOURS_IN_WEEK));
    const totalMonths = Math.max(1, Math.floor(totalWeeks / this.WEEKS_IN_MONTH));
    const totalYears = Number((totalMonths / this.MONTHS_IN_YEAR).toFixed(1));

    timeComponent.gameDays = totalDays;
    timeComponent.gameWeeks = totalWeeks;
    timeComponent.gameMonths = totalMonths;
    timeComponent.gameYears = totalYears;
    timeComponent.currentAge = (timeComponent.startAge ?? 18) + Math.floor(totalDays / this.DAYS_IN_AGE_YEAR);

    timeComponent.hourOfDay = ((totalHours % this.HOURS_IN_DAY) + this.HOURS_IN_DAY) % this.HOURS_IN_DAY;
    timeComponent.dayOfWeek = (Math.floor(totalHours / this.HOURS_IN_DAY) % 7) + 1;

    timeComponent.dayHoursSpent = timeComponent.hourOfDay;
    timeComponent.dayHoursRemaining = this.HOURS_IN_DAY - timeComponent.dayHoursSpent;

    timeComponent.weekHoursSpent = totalHours % this.HOURS_IN_WEEK;
    timeComponent.weekHoursRemaining = this.HOURS_IN_WEEK - timeComponent.weekHoursSpent;

    if (typeof timeComponent.sleepHoursToday !== 'number') timeComponent.sleepHoursToday = 0;
    if (typeof timeComponent.sleepDebt !== 'number') timeComponent.sleepDebt = 0;
    if (!timeComponent.eventState || typeof timeComponent.eventState !== 'object') {
      timeComponent.eventState = {};
    }
    if (!timeComponent.eventState.cooldownByEventId || typeof timeComponent.eventState.cooldownByEventId !== 'object') {
      timeComponent.eventState.cooldownByEventId = {};
    }
    if (typeof timeComponent.eventState.lastWeeklyEventWeek !== 'number') {
      timeComponent.eventState.lastWeeklyEventWeek = Math.max(0, totalWeeks - 1);
    }
    if (typeof timeComponent.eventState.lastMonthlyEventMonth !== 'number') {
      timeComponent.eventState.lastMonthlyEventMonth = Math.max(0, totalMonths - 1);
    }
    if (typeof timeComponent.eventState.lastYearlyEventYear !== 'number') {
      timeComponent.eventState.lastYearlyEventYear = Math.max(0, Math.floor(totalMonths / this.MONTHS_IN_YEAR));
    }
  }

  /**
   * Основной API: продвинуть время на часы.
   */
  advanceHours(hours = 1, options = {}) {
    const playerId = PLAYER_ENTITY;
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT);
    if (!timeComponent) return { weekly: [], monthly: [], yearly: [], age: [] };

    this.normalizeTimeComponent(timeComponent);

    const safeHours = Math.max(0, Number(hours) || 0);
    if (safeHours <= 0) {
      return { weekly: [], monthly: [], yearly: [], age: [] };
    }

    const previousWeek = timeComponent.gameWeeks;
    const previousMonth = timeComponent.gameMonths;
    const previousYearIndex = Math.floor(previousMonth / this.MONTHS_IN_YEAR);
    const previousAge = timeComponent.currentAge;
    const previousDay = timeComponent.gameDays;

    timeComponent.totalHours += safeHours;
    this.normalizeTimeComponent(timeComponent);

    const sleepHours = Math.max(0, Number(options.sleepHours) || 0);
    const dayAdvanced = timeComponent.gameDays - previousDay;
    if (dayAdvanced > 0) {
      if ((timeComponent.sleepHoursToday ?? 0) < 7) {
        timeComponent.sleepDebt = (timeComponent.sleepDebt ?? 0) + (7 - (timeComponent.sleepHoursToday ?? 0));
      }
      timeComponent.sleepHoursToday = 0;
    }
    if (sleepHours > 0) {
      timeComponent.sleepHoursToday = Math.min(24, (timeComponent.sleepHoursToday ?? 0) + sleepHours);
      if (timeComponent.sleepDebt > 0) {
        timeComponent.sleepDebt = Math.max(0, timeComponent.sleepDebt - sleepHours * 0.5);
      }
    }

    const events = { weekly: [], monthly: [], yearly: [], age: [] };

    if (timeComponent.gameWeeks > previousWeek) {
      for (let week = previousWeek + 1; week <= timeComponent.gameWeeks; week += 1) {
        events.weekly.push(week);
        this._triggerWeeklyEvents(week);
      }
    }

    if (timeComponent.gameMonths > previousMonth) {
      for (let month = previousMonth + 1; month <= timeComponent.gameMonths; month += 1) {
        events.monthly.push(month);
        this._triggerMonthlyEvents(month);

        // Логирование смены месяца
        if (this.world && this.world.eventBus) {
          this.world.eventBus.dispatchEvent(new CustomEvent('activity:time', {
            detail: {
              category: 'new_month',
              title: '🗓️ Новый месяц',
              description: `Начался ${month}й месяц ${Math.floor(month / this.MONTHS_IN_YEAR)}го года. Возраст: ${timeComponent.currentAge}`,
              icon: null,
              metadata: {
                month,
                year: Math.floor(month / this.MONTHS_IN_YEAR),
                age: timeComponent.currentAge,
                totalHours: timeComponent.totalHours,
              },
            },
          }));
        }
      }
    }

    const currentYearIndex = Math.floor(timeComponent.gameMonths / this.MONTHS_IN_YEAR);
    if (currentYearIndex > previousYearIndex) {
      for (let year = previousYearIndex + 1; year <= currentYearIndex; year += 1) {
        events.yearly.push(year);
        this._triggerYearlyEvents(year);

        // Логирование смены года
        if (this.world && this.world.eventBus) {
          this.world.eventBus.dispatchEvent(new CustomEvent('activity:time', {
            detail: {
              category: 'new_year',
              title: '🎆 Новый год',
              description: `Начался ${year}й год. Возраст: ${timeComponent.currentAge}`,
              icon: null,
              metadata: {
                month: timeComponent.gameMonths,
                year,
                age: timeComponent.currentAge,
                totalHours: timeComponent.totalHours,
              },
            },
          }));
        }
      }
    }

    if (timeComponent.currentAge > previousAge) {
      this._triggerAgeEvents(previousAge, timeComponent.currentAge);
    }

    const actionType = options.actionType || 'default';
    if (actionType !== 'sleep') {
      this.maybeTriggerMicroEvent(actionType, options);
    }

    return events;
  }

  /**
   * Добавить callback для недельных событий
   */
  onWeeklyEvent(callback) {
    this.weeklyEventCallbacks.push(callback);
  }

  /**
   * Добавить callback для месячных событий
   */
  onMonthlyEvent(callback) {
    this.monthlyEventCallbacks.push(callback);
  }

  /**
   * Добавить callback для годовых событий
   */
  onYearlyEvent(callback) {
    this.yearlyEventCallbacks.push(callback);
  }

  /**
   * Добавить callback для событий по возрасту
   */
  onAgeEvent(callback) {
    this.ageEventCallbacks.push(callback);
  }

  _triggerWeeklyEvents(weekNumber) {
    for (const callback of this.weeklyEventCallbacks) {
      callback(weekNumber);
    }
  }

  _triggerMonthlyEvents(monthNumber) {
    for (const callback of this.monthlyEventCallbacks) {
      callback(monthNumber);
    }
  }

  _triggerYearlyEvents(yearNumber) {
    for (const callback of this.yearlyEventCallbacks) {
      callback(yearNumber);
    }
  }

  _triggerAgeEvents(previousAge, currentAge) {
    for (const callback of this.ageEventCallbacks) {
      callback(previousAge, currentAge);
    }
  }

  maybeTriggerMicroEvent(actionType = 'default', options = {}) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const queue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) || {};
    const skillModifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) || {};
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT) || {};
    if (!time || !queue) return null;

    const def = this.microEventDefinitions[actionType] || this.microEventDefinitions.default;
    const riskByMoney = (wallet.money ?? 0) > 150000 ? 1.25 : 1;
    const riskByStress = (stats?.stress ?? 0) >= 75 ? 1.2 : 1;
    const riskByEnergy = (stats?.energy ?? 50) <= 25 ? 1.15 : 1;
    const explicitRisk = Number(options.riskMultiplier ?? 1) || 1;

    const skillSafety =
      ((skills.physicalFitness ?? 0) * 0.02) +
      ((skills.athletics ?? 0) * 0.02) +
      (skillModifiers.negativeEventPenaltyReduction ?? 0);

    const positiveBonus = skillModifiers.positiveEventChanceBonus ?? 0;
    const finalChance = this._clampChance(
      def.baseChance * riskByMoney * riskByStress * riskByEnergy * explicitRisk * (1 + positiveBonus) * (1 - skillSafety * 0.6),
    );
    const roll = Math.random();
    if (roll > finalChance) return null;

    const cooldownKey = def.id;
    const lastHour = Number(time.eventState?.cooldownByEventId?.[cooldownKey] ?? -9999);
    const cooldownHours = 48;
    if (time.totalHours - lastHour < cooldownHours) {
      return null;
    }

    const microEvent = this._buildMicroEvent(def, actionType);
    const alreadyQueued = (queue.pendingEvents || []).some((item) => item.instanceId === microEvent.instanceId);
    if (!alreadyQueued) {
      if (!Array.isArray(queue.pendingEvents)) queue.pendingEvents = [];
      queue.pendingEvents.push(microEvent);
      time.eventState.cooldownByEventId[cooldownKey] = time.totalHours;
    }
    return microEvent;
  }

  _buildMicroEvent(def, actionType) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const instanceId = `${def.id}_${time.totalHours}`;

    if (def.id === 'micro_robbery_market') {
      return {
        ...def,
        type: 'micro',
        actionSource: actionType,
        instanceId,
        choices: [
          {
            label: 'Попытаться убежать',
            outcome: 'Вы рванули с места. Всё решает подготовка и реакция.',
            skillCheck: {
              key: 'physicalFitness',
              threshold: 4,
              successStatChanges: { stress: -4, mood: 2 },
              failStatChanges: { health: -6, stress: 8, mood: -4 },
              failMoneyDelta: -1200,
            },
          },
          {
            label: 'Отдать часть денег',
            outcome: 'Конфликт не обострился, но кошелёк похудел.',
            moneyDelta: -900,
            statChanges: { stress: 5, mood: -2 },
          },
        ],
      };
    }

    return {
      ...def,
      type: 'micro',
      actionSource: actionType,
      instanceId,
      choices: [
        {
          label: 'Реагировать спокойно',
          outcome: 'Вы выбрали спокойный вариант и сохранили темп.',
          statChanges: { stress: -3, mood: 2 },
        },
        {
          label: 'Проигнорировать',
          outcome: 'Ничего критичного не произошло, но остался осадок.',
          statChanges: { stress: 2 },
        },
      ],
    };
  }

  _clampChance(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }
}
