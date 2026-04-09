import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  STATS_COMPONENT,
  WALLET_COMPONENT,
} from '../components/index.js';
import { MICRO_EVENT_BY_ACTION, buildMicroQueuedEvent } from '../../balance/game-events.js';

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

  /** Остаток часов в текущих сутках (после нормализации по totalHours). */
  getDayHoursRemaining() {
    const timeComponent = this.world?.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
    if (!timeComponent) return 0;
    this.normalizeTimeComponent(timeComponent);
    return timeComponent.dayHoursRemaining;
  }

  /** Остаток часов в текущей 168-часовой неделе. */
  getWeekHoursRemaining() {
    const timeComponent = this.world?.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
    if (!timeComponent) return 0;
    this.normalizeTimeComponent(timeComponent);
    return timeComponent.weekHoursRemaining;
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
    // 1-я игровая неделя = часы [0..167], 2-я = [168..335]; иначе rollover недели и хуки не срабатывают.
    const weekIndex0 = Math.floor(totalHours / this.HOURS_IN_WEEK);
    const monthIndex0 = Math.floor(weekIndex0 / this.WEEKS_IN_MONTH);

    timeComponent.gameDays = totalDays;
    timeComponent.gameWeeks = weekIndex0 + 1;
    timeComponent.gameMonths = monthIndex0 + 1;
    timeComponent.gameYears = Number(((monthIndex0 + 1) / this.MONTHS_IN_YEAR).toFixed(1));
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
      timeComponent.eventState.lastWeeklyEventWeek = Math.max(0, weekIndex0);
    }
    if (typeof timeComponent.eventState.lastMonthlyEventMonth !== 'number') {
      timeComponent.eventState.lastMonthlyEventMonth = Math.max(0, monthIndex0);
    }
    if (typeof timeComponent.eventState.lastYearlyEventYear !== 'number') {
      timeComponent.eventState.lastYearlyEventYear = Math.max(0, Math.floor(monthIndex0 / this.MONTHS_IN_YEAR));
    }
  }

  /**
   * Индекс календарного года (0-based) из 1-based счётчика месяцев игры (1 = первый месяц).
   */
  _calendarYearIndex0FromMonth(month1Based) {
    const m = Math.max(1, Math.floor(Number(month1Based) || 1));
    return Math.floor((m - 1) / this.MONTHS_IN_YEAR);
  }

  /**
   * Номер календарного года для UI (1-based): месяцы 1–12 → год 1, 13–24 → год 2.
   */
  _displayCalendarYearFromMonth(month1Based) {
    return this._calendarYearIndex0FromMonth(month1Based) + 1;
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
    const previousYearIndex = this._calendarYearIndex0FromMonth(previousMonth);
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

        // Логирование смены месяца (month — абсолютный 1-based; в тексте — месяц внутри года)
        if (this.world && this.world.eventBus) {
          const monthInYear = ((month - 1) % this.MONTHS_IN_YEAR) + 1;
          const calendarYear = this._displayCalendarYearFromMonth(month);
          this.world.eventBus.dispatchEvent(new CustomEvent('activity:time', {
            detail: {
              category: 'new_month',
              title: '🗓️ Новый месяц',
              description: `Начался ${monthInYear}-й месяц ${calendarYear}-го года. Возраст: ${timeComponent.currentAge}`,
              icon: null,
              metadata: {
                month,
                monthInYear,
                year: calendarYear,
                age: timeComponent.currentAge,
                totalHours: timeComponent.totalHours,
              },
            },
          }));
        }
      }
    }

    const currentYearIndex = this._calendarYearIndex0FromMonth(timeComponent.gameMonths);
    if (currentYearIndex > previousYearIndex) {
      for (let yi = previousYearIndex + 1; yi <= currentYearIndex; yi += 1) {
        const displayYear = yi + 1;
        events.yearly.push(displayYear);
        this._triggerYearlyEvents(displayYear);

        if (this.world && this.world.eventBus) {
          this.world.eventBus.dispatchEvent(new CustomEvent('activity:time', {
            detail: {
              category: 'new_year',
              title: '🎆 Новый год',
              description: `Начался ${displayYear}-й календарный год. Возраст: ${timeComponent.currentAge}`,
              icon: null,
              metadata: {
                month: timeComponent.gameMonths,
                year: displayYear,
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

    const def = MICRO_EVENT_BY_ACTION[actionType] || MICRO_EVENT_BY_ACTION.default;
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
    return buildMicroQueuedEvent(def, actionType, time.totalHours);
  }

  _clampChance(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }
}
