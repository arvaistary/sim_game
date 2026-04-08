import { PLAYER_ENTITY, TIME_COMPONENT, STATS_COMPONENT } from '../components/index.js';

/**
 * Система управления временем
 * Обрабатывает прогресс времени, недельные и месячные события
 */
export class TimeSystem {
  constructor() {
    this.weeklyEventCallbacks = [];
    this.monthlyEventCallbacks = [];
    this.ageEventCallbacks = [];
  }

  init(world) {
    this.world = world;
  }

  update(world, deltaTime) {
    const playerId = PLAYER_ENTITY;
    const timeComponent = world.getComponent(playerId, TIME_COMPONENT);
    if (!timeComponent) return;

    const previousWeek = timeComponent.gameWeeks;
    const previousMonth = timeComponent.gameMonths;
    const previousAge = timeComponent.currentAge;

    // Недельные события
    if (timeComponent.gameWeeks > previousWeek) {
      for (let week = previousWeek + 1; week <= timeComponent.gameWeeks; week++) {
        this.triggerWeeklyEvents(week);
      }
    }

    // Месячные события
    if (timeComponent.gameMonths > previousMonth) {
      for (let month = previousMonth + 1; month <= timeComponent.gameMonths; month++) {
        this.triggerMonthlyEvents(month);
      }
    }

    // События по возрасту
    if (timeComponent.currentAge > previousAge) {
      this.triggerAgeEvents(previousAge, timeComponent.currentAge);
    }
  }

  /**
   * Продвинуть время на указанное количество дней
   */
  advanceTime(days = 1) {
    const playerId = PLAYER_ENTITY;
    const timeComponent = this.world.getComponent(playerId, TIME_COMPONENT);
    if (!timeComponent) return;

    const previousWeek = timeComponent.gameWeeks;
    const previousMonth = timeComponent.gameMonths;
    const previousAge = timeComponent.currentAge;

    timeComponent.gameDays += days;
    timeComponent.gameWeeks = Math.max(1, Math.floor(timeComponent.gameDays / 7));
    timeComponent.gameMonths = Math.max(1, Math.floor(timeComponent.gameDays / 30));
    timeComponent.gameYears = Number((timeComponent.gameDays / 360).toFixed(1));
    timeComponent.currentAge = timeComponent.startAge + Math.floor(timeComponent.gameDays / 360);

    // Генерируем события на основе изменений
    const events = {
      weekly: [],
      monthly: [],
      age: []
    };

    if (timeComponent.gameWeeks > previousWeek) {
      for (let week = previousWeek + 1; week <= timeComponent.gameWeeks; week++) {
        events.weekly.push(week);
      }
    }

    if (timeComponent.gameMonths > previousMonth) {
      for (let month = previousMonth + 1; month <= timeComponent.gameMonths; month++) {
        events.monthly.push(month);
      }
    }

    GLOBAL_PROGRESS_EVENTS
      .filter(event => event.type === 'age' && event.triggerAge > previousAge && event.triggerAge <= timeComponent.currentAge)
      .forEach(event => {
        events.age.push(event);
      });

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

  _triggerAgeEvents(previousAge, currentAge) {
    for (const callback of this.ageEventCallbacks) {
      callback(previousAge, currentAge);
    }
  }
}

// Временная константа, будет перенесена в data
const GLOBAL_PROGRESS_EVENTS = [
  {
    id: 'weekly_bonus_moment',
    type: 'weekly',
    title: 'Конец недели',
    description: 'Неделя закрыта. Можно перевести дух, взять маленький бонус к настроению или спокойно спланировать следующую.',
    choices: [
      {
        label: 'Наградить себя',
        outcome: 'Небольшой ритуал завершения недели помогает не рассыпаться на дистанции.',
        moneyDelta: -900,
        statChanges: { mood: 12, stress: -8 },
      },
      {
        label: 'Планировать дальше',
        outcome: 'Ты сохранил деньги и чуть снизил тревогу перед следующими днями.',
        statChanges: { stress: -5 },
        skillChanges: { timeManagement: 1 },
      },
    ],
  },
  {
    id: 'weekly_friend_ping',
    type: 'weekly',
    title: 'Сообщение от друга',
    description: 'Под конец недели написал старый друг: зовёт выбраться на прогулку и выдохнуть после работы.',
    choices: [
      {
        label: 'Встретиться',
        outcome: 'Короткая встреча заметно подняла настроение и поддержала отношения.',
        moneyDelta: -500,
        statChanges: { mood: 10, stress: -6 },
        relationshipDelta: 8,
      },
      {
        label: 'Ответить позже',
        outcome: 'Ты сохранил силы сегодня, но контакт чуть остыл.',
        statChanges: { energy: 4 },
        relationshipDelta: -3,
      },
    ],
  },
  {
    id: 'age_30_reunion',
    type: 'age',
    triggerAge: 30,
    title: '30 лет: встреча выпускников',
    description: 'Тебя приглашают на встречу выпускников. Можно сравнить свой путь с чужими историями и немного переосмыслить цель.',
    choices: [
      {
        label: 'Пойти',
        outcome: 'Вечер вышел тёплым и немного вдохновляющим.',
        moneyDelta: -500,
        statChanges: { mood: 12, stress: -4 },
        skillChanges: { communication: 1 },
      },
      {
        label: 'Не идти',
        outcome: 'Ты сохранил спокойствие и остался в своём ритме.',
        statChanges: { stress: -2 },
      },
    ],
  },
];
