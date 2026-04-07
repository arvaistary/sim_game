import { 
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

/**
 * Система управления очередью событий
 * Отслеживает и обрабатывает отложенные события
 */
export class EventQueueSystem {
  constructor() {
    this.eventQueue = [];
  }

  init(world) {
    this.world = world;
  }

  /**
   * Получить следующее событие из очереди
   */
  getNextEvent() {
    const playerId = PLAYER_ENTITY;
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);

    if (!eventQueue || !eventQueue.pendingEvents || eventQueue.pendingEvents.length === 0) {
      return null;
    }

    return eventQueue.pendingEvents[0];
  }

  /**
   * Удалить и вернуть следующее событие из очереди
   */
  consumePendingEvent() {
    const playerId = PLAYER_ENTITY;
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);

    if (!eventQueue || !eventQueue.pendingEvents || eventQueue.pendingEvents.length === 0) {
      return null;
    }

    return eventQueue.pendingEvents.shift() || null;
  }

  /**
   * Добавить событие в очередь
   */
  queuePendingEvent(event) {
    const playerId = PLAYER_ENTITY;
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!eventHistory) {
      return false;
    }

    // Проверяем, не было ли событие уже обработано
    const instanceId = event.instanceId || `${event.id}_${Date.now()}`;
    const alreadyHandled = (eventHistory.events || []).some(item => item.eventId === instanceId);
    const alreadyQueued = (this._getEventQueue().pendingEvents || []).some(item => item.instanceId === instanceId);

    if (alreadyHandled || alreadyQueued) {
      return false;
    }

    // Добавляем событие в очередь
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    if (!eventQueue.pendingEvents) {
      eventQueue.pendingEvents = [];
    }
    eventQueue.pendingEvents.push({ ...event, instanceId });

    return true;
  }

  /**
   * Получить все события в очереди
   */
  getEventQueue() {
    const playerId = PLAYER_ENTITY;
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);

    if (!eventQueue) {
      return { pendingEvents: [] };
    }

    return {
      pendingEvents: eventQueue.pendingEvents || [],
      count: (eventQueue.pendingEvents || []).length,
    };
  }

  /**
   * Проверить, есть ли события в очереди
   */
  hasPendingEvents() {
    const queue = this.getEventQueue();
    return queue.count > 0;
  }

  /**
   * Очистить очередь событий
   */
  clearEventQueue() {
    const playerId = PLAYER_ENTITY;
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);

    if (eventQueue) {
      eventQueue.pendingEvents = [];
    }
  }

  /**
   * Получить количество событий в очереди
   */
  getEventCount() {
    const queue = this.getEventQueue();
    return queue.count;
  }

  /**
   * Получить объект очереди событий
   */
  _getEventQueue() {
    const playerId = PLAYER_ENTITY;
    return this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) || { pendingEvents: [] };
  }
}
