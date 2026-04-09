import {
  ACTIVITY_LOG_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../components/index.js';

/**
 * Типы записей лога активности
 */
export const LOG_ENTRY_TYPES = {
  ACTION: 'action',
  EVENT: 'event',
  STAT_CHANGE: 'stat_change',
  SKILL_CHANGE: 'skill_change',
  FINANCE: 'finance',
  CAREER: 'career',
  NAVIGATION: 'navigation',
  PREVENTED: 'prevented',
  TIME: 'time',
  EDUCATION: 'education',
};

/** Максимальное количество хранимых записей */
const MAX_ENTRIES = 500;

/**
 * Система логирования активности игрока
 * Подписывается на события eventBus и собирает записи в ACTIVITY_LOG_COMPONENT
 */
export class ActivityLogSystem {
  constructor() {
    this.world = null;
    this._listeners = [];
  }

  // ─── Инициализация ───────────────────────────────────────────────

  init(world) {
    this.world = world;

    // Инициализировать компонент, если его нет
    this._ensureComponent();

    // Подписаться на события eventBus
    this._subscribeToEvents();
  }

  // ─── Публичные методы ────────────────────────────────────────────

  /**
   * Добавить запись в лог.
   * @param {object} entryData
   * @param {string} entryData.type        — из LOG_ENTRY_TYPES
   * @param {string} entryData.category    — подкатегория
   * @param {string} entryData.title       — краткий заголовок
   * @param {string} entryData.description — подробное описание
   * @param {string|null} [entryData.icon] — ключ иконки
   * @param {object} [entryData.metadata]  — доп. данные
   * @returns {object} созданная запись
   */
  addEntry(entryData) {
    const log = this._getLog();
    if (!log) return null;

    const timestamp = this._getCurrentTimestamp();

    const entry = {
      id: log.totalEntries,
      type: entryData.type,
      category: entryData.category || null,
      title: entryData.title || '',
      description: entryData.description || '',
      icon: entryData.icon ?? null,
      timestamp,
      metadata: entryData.metadata || {},
      createdAt: Date.now(),
    };

    log.entries.push(entry);

    // Ротация: удаляем старые записи при превышении лимита
    if (log.entries.length > MAX_ENTRIES) {
      log.entries.shift();
    }

    log.totalEntries++;

    return entry;
  }

  /**
   * Получить записи с пагинацией и фильтрацией.
   * @param {object} [options]
   * @param {number} [options.limit=50]
   * @param {number} [options.offset=0]
   * @param {string} [options.type]          — фильтр по типу
   * @param {number} [options.sinceTotalHours] — только записи после указанного totalHours
   * @returns {{ entries: object[], total: number, hasMore: boolean }}
   */
  getEntries(options = {}) {
    const log = this._getLog();
    if (!log) return { entries: [], total: 0, hasMore: false };

    const { limit = 50, offset = 0, type, sinceTotalHours } = options;

    let filtered = log.entries;

    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }

    if (typeof sinceTotalHours === 'number') {
      filtered = filtered.filter(e => e.timestamp.totalHours > sinceTotalHours);
    }

    const total = filtered.length;
    const sliced = filtered.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return { entries: sliced, total, hasMore };
  }

  /**
   * Последние N записей (из конца массива).
   * @param {number} [count=10]
   * @returns {object[]}
   */
  getRecentEntries(count = 10) {
    const log = this._getLog();
    if (!log) return [];

    return log.entries.slice(-count);
  }

  /**
   * Получить записи по типу.
   * @param {string} type — из LOG_ENTRY_TYPES
   * @param {number} [limit=50]
   * @returns {object[]}
   */
  getEntriesByType(type, limit = 50) {
    const log = this._getLog();
    if (!log) return [];

    return log.entries
      .filter(e => e.type === type)
      .slice(-limit);
  }

  /**
   * Удалить записи старше maxAge (по totalHours).
   * @param {number} maxAge — пороговое значение totalHours; записи с меньшим значением удаляются
   * @returns {number} количество удалённых записей
   */
  clearOldEntries(maxAge) {
    const log = this._getLog();
    if (!log) return 0;

    const before = log.entries.length;
    log.entries = log.entries.filter(e => e.timestamp.totalHours >= maxAge);

    return before - log.entries.length;
  }

  // ─── Приватные методы ────────────────────────────────────────────

  /**
   * Получить или создать ACTIVITY_LOG_COMPONENT для player
   */
  _ensureComponent() {
    const existing = this.world.getComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT);
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT, {
        entries: [],
        totalEntries: 0,
      });
    }
  }

  /**
   * Получить ссылку на данные лога
   */
  _getLog() {
    return this.world.getComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT);
  }

  /**
   * Сформировать объект текущего игрового времени из TIME_COMPONENT
   */
  _getCurrentTimestamp() {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);

    if (!time) {
      return {
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        hour: 0,
        totalHours: 0,
        age: 0,
      };
    }

    return {
      day: time.gameDays ?? 0,
      week: time.gameWeeks ?? 0,
      month: time.gameMonths ?? 0,
      year: time.gameYears ?? 0,
      hour: time.hourOfDay ?? 0,
      totalHours: time.totalHours ?? 0,
      age: time.currentAge ?? 0,
    };
  }

  /**
   * Подписаться на все activity:* события eventBus
   */
  _subscribeToEvents() {
    const bus = this.world.eventBus;

    const eventMap = [
      ['activity:action',      LOG_ENTRY_TYPES.ACTION],
      ['activity:event',       LOG_ENTRY_TYPES.EVENT],
      ['activity:stat',        LOG_ENTRY_TYPES.STAT_CHANGE],
      ['activity:skill',       LOG_ENTRY_TYPES.SKILL_CHANGE],
      ['activity:finance',     LOG_ENTRY_TYPES.FINANCE],
      ['activity:career',      LOG_ENTRY_TYPES.CAREER],
      ['activity:navigation',  LOG_ENTRY_TYPES.NAVIGATION],
      ['activity:prevented',   LOG_ENTRY_TYPES.PREVENTED],
      ['activity:time',        LOG_ENTRY_TYPES.TIME],
      ['activity:education',   LOG_ENTRY_TYPES.EDUCATION],
    ];

    for (const [eventName, type] of eventMap) {
      const handler = (event) => {
        const detail = event.detail || {};
        this.addEntry({
          type,
          category: detail.category || null,
          title: detail.title || '',
          description: detail.description || '',
          icon: detail.icon ?? null,
          metadata: detail.metadata || {},
        });
      };

      bus.addEventListener(eventName, handler);
      this._listeners.push({ eventName, handler });
    }
  }

  /**
   * Отписаться от всех событий (для очистки при destroy)
   */
  destroy() {
    const bus = this.world?.eventBus;
    if (!bus) return;

    for (const { eventName, handler } of this._listeners) {
      bus.removeEventListener(eventName, handler);
    }

    this._listeners = [];
  }
}

export default ActivityLogSystem;
