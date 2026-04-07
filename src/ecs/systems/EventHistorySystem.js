import { 
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

/**
 * Система истории событий
 * Отслеживает и предоставляет историю произошедших событий
 */
export class EventHistorySystem {
  constructor() {
    this.eventHistory = [];
  }

  init(world) {
    this.world = world;
  }

  /**
   * Записать событие в историю
   */
  recordEvent(eventId, title) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!time || !eventHistory) {
      return false;
    }

    if (!eventHistory.events) {
      eventHistory.events = [];
    }

    eventHistory.events.push({
      eventId,
      day: time.gameDays,
      title,
    });

    eventHistory.totalEvents = (eventHistory.totalEvents ?? 0) + 1;

    return true;
  }

  /**
   * Получить историю событий
   */
  getEventHistory(limit = 50) {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventHistory) {
      return [];
    }

    const events = eventHistory.events || [];
    return events.slice(-limit).reverse();
  }

  /**
   * Получить события по идентификатору
   */
  getEventsById(eventId) {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventHistory) {
      return [];
    }

    const events = eventHistory.events || [];
    return events.filter(event => event.eventId === eventId).reverse();
  }

  /**
   * Получить события за последние N дней
   */
  getRecentEvents(days = 30) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!time || !eventHistory) {
      return [];
    }

    const events = eventHistory.events || [];
    const minDay = time.gameDays - days;

    return events
      .filter(event => event.day >= minDay)
      .reverse();
  }

  /**
   * Получить статистику по событиям
   */
  getEventStats() {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventHistory) {
      return {
        total: 0,
        unique: 0,
        recentWeek: 0,
        recentMonth: 0,
      };
    }

    const events = eventHistory.events || [];
    const time = this.world.getComponent(playerId, TIME_COMPONENT);

    const uniqueEvents = new Set(events.map(e => e.eventId));

    let recentWeek = 0;
    let recentMonth = 0;

    if (time) {
      const weekStart = time.gameDays - 7;
      const monthStart = time.gameDays - 30;

      recentWeek = events.filter(e => e.day >= weekStart).length;
      recentMonth = events.filter(e => e.day >= monthStart).length;
    }

    return {
      total: events.length,
      unique: uniqueEvents.size,
      recentWeek,
      recentMonth,
    };
  }

  /**
   * Проверить, было ли событие
   */
  hasEventOccurred(eventId) {
    const events = this.getEventsById(eventId);
    return events.length > 0;
  }

  /**
   * Получить последнее вхождение события
   */
  getLastEventOccurrence(eventId) {
    const events = this.getEventsById(eventId);
    return events[0] || null;
  }

  /**
   * Очистить историю событий
   */
  clearHistory() {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (eventHistory) {
      eventHistory.events = [];
      eventHistory.totalEvents = 0;
    }
  }

  /**
   * Получить общее количество событий
   */
  getTotalEventCount() {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventHistory) {
      return 0;
    }

    return eventHistory.totalEvents ?? 0;
  }
}
