import { jest } from '@jest/globals';
import { ActivityLogSystem, LOG_ENTRY_TYPES } from '../../src/ecs/systems/ActivityLogSystem.js';

/**
 * Мок-объект world для тестирования ActivityLogSystem.
 * Реализует минимально необходимое ECS API:
 * - getComponent(id, key) / addComponent(id, key, data)
 * - eventBus с addEventListener / removeEventListener
 */
function createMockWorld(state = {}) {
  const playerId = 'player';
  const componentMap = new Map();

  function addComponent(entityId, key, data) {
    if (!componentMap.has(key)) componentMap.set(key, new Map());
    componentMap.get(key).set(entityId, { ...data });
  }

  function getComponent(entityId, key) {
    return componentMap.get(key)?.get(entityId) ?? null;
  }

  function updateComponent(entityId, key, updates) {
    const existing = getComponent(entityId, key);
    if (existing !== null) {
      componentMap.get(key).set(entityId, { ...existing, ...updates });
    }
  }

  // Инициализация TIME_COMPONENT (нужен для timestamp)
  addComponent(playerId, 'time', {
    gameDays: 1,
    gameWeeks: 1,
    gameMonths: 1,
    gameYears: 2024,
    hourOfDay: 10,
    totalHours: 100,
    currentAge: 25,
    ...(state.time || {}),
  });

  // eventBus с реальной диспетчеризацией для интеграционных тестов
  const listeners = {};

  const eventBus = {
    addEventListener: jest.fn((event, cb) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    removeEventListener: jest.fn((event, cb) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(fn => fn !== cb);
      }
    }),
    // Вспомогательный метод для диспетчеризации в тестах
    _dispatch(type, detail = {}) {
      const cbs = listeners[type] || [];
      cbs.forEach(cb => cb({ type, detail }));
    },
  };

  return {
    getComponent,
    addComponent,
    updateComponent,
    eventBus,
    _listeners: listeners,
    _componentMap: componentMap,
  };
}

describe('ActivityLogSystem', () => {
  let system;
  let mockWorld;

  beforeEach(() => {
    system = new ActivityLogSystem();
    mockWorld = createMockWorld();
  });

  afterEach(() => {
    if (system) {
      system.destroy();
    }
  });

  // ─── 1. Инициализация ────────────────────────────────────────────

  describe('init', () => {
    test('creates ACTIVITY_LOG_COMPONENT with default values', () => {
      system.init(mockWorld);

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log).toBeDefined();
      expect(log.entries).toEqual([]);
      expect(log.totalEntries).toBe(0);
    });

    test('does not overwrite existing ACTIVITY_LOG_COMPONENT', () => {
      // Предварительно добавляем компонент с данными
      mockWorld.addComponent('player', 'activity_log', {
        entries: [{ id: 0, type: 'action', title: 'old' }],
        totalEntries: 1,
      });

      system.init(mockWorld);

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.totalEntries).toBe(1);
      expect(log.entries).toHaveLength(1);
    });

    test('subscribes to all 10 eventBus events', () => {
      system.init(mockWorld);

      expect(mockWorld.eventBus.addEventListener).toHaveBeenCalledTimes(10);

      const expectedEvents = [
        'activity:action',
        'activity:event',
        'activity:stat',
        'activity:skill',
        'activity:finance',
        'activity:career',
        'activity:navigation',
        'activity:prevented',
        'activity:time',
        'activity:education',
      ];

      for (const eventName of expectedEvents) {
        expect(mockWorld.eventBus.addEventListener).toHaveBeenCalledWith(
          eventName,
          expect.any(Function),
        );
      }
    });
  });

  // ─── 2. addEntry ─────────────────────────────────────────────────

  describe('addEntry', () => {
    beforeEach(() => {
      system.init(mockWorld);
    });

    test('creates entry with correct structure', () => {
      const entry = system.addEntry({
        type: LOG_ENTRY_TYPES.ACTION,
        category: 'fun',
        title: 'Прогулка в парке',
        description: 'Вы прогулялись по парку',
        icon: 'walk',
        metadata: { actionId: 'fun_park_walk' },
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBe(0);
      expect(entry.type).toBe('action');
      expect(entry.category).toBe('fun');
      expect(entry.title).toBe('Прогулка в парке');
      expect(entry.description).toBe('Вы прогулялись по парку');
      expect(entry.icon).toBe('walk');
      expect(entry.metadata).toEqual({ actionId: 'fun_park_walk' });
      expect(entry.createdAt).toBeDefined();
      expect(typeof entry.createdAt).toBe('number');
    });

    test('auto-increments id', () => {
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'First' });
      system.addEntry({ type: LOG_ENTRY_TYPES.EVENT, title: 'Second' });
      const third = system.addEntry({ type: LOG_ENTRY_TYPES.FINANCE, title: 'Third' });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries[0].id).toBe(0);
      expect(log.entries[1].id).toBe(1);
      expect(third.id).toBe(2);
      expect(log.totalEntries).toBe(3);
    });

    test('rotates entries when exceeding MAX_ENTRIES (500)', () => {
      // Заполняем 502 записи
      for (let i = 0; i < 502; i++) {
        system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: `Entry ${i}` });
      }

      const log = mockWorld.getComponent('player', 'activity_log');
      // После ротации должно быть 500 записей
      expect(log.entries.length).toBe(500);
      // totalEntries должен быть 502
      expect(log.totalEntries).toBe(502);
      // Первая запись теперь с id=2 (две старые удалены)
      expect(log.entries[0].id).toBe(2);
      // Последняя запись с id=501
      expect(log.entries[499].id).toBe(501);
    });

    test('includes timestamp from TIME_COMPONENT', () => {
      const entry = system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Test' });

      expect(entry.timestamp).toBeDefined();
      expect(entry.timestamp.day).toBe(1);
      expect(entry.timestamp.week).toBe(1);
      expect(entry.timestamp.month).toBe(1);
      expect(entry.timestamp.year).toBe(2024);
      expect(entry.timestamp.hour).toBe(10);
      expect(entry.timestamp.totalHours).toBe(100);
      expect(entry.timestamp.age).toBe(25);
    });

    test('returns null when component is missing', () => {
      // Создаём мир без компонента и не вызываем init
      const emptyWorld = createMockWorld();
      // Удаляем activity_log если init его создал — нет, мы не вызывали init для system
      const freshSystem = new ActivityLogSystem();
      freshSystem.world = emptyWorld;
      // Не вызываем _ensureComponent, поэтому _getLog вернёт null
      const result = freshSystem.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Test' });
      expect(result).toBeNull();
    });

    test('uses default values for optional fields', () => {
      const entry = system.addEntry({ type: LOG_ENTRY_TYPES.ACTION });

      expect(entry.category).toBeNull();
      expect(entry.title).toBe('');
      expect(entry.description).toBe('');
      expect(entry.icon).toBeNull();
      expect(entry.metadata).toEqual({});
    });
  });

  // ─── 3. getEntries ───────────────────────────────────────────────

  describe('getEntries', () => {
    beforeEach(() => {
      system.init(mockWorld);
      // Добавляем тестовые записи
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Walk', metadata: {} });
      system.addEntry({ type: LOG_ENTRY_TYPES.EVENT, title: 'Random event', metadata: {} });
      system.addEntry({ type: LOG_ENTRY_TYPES.FINANCE, title: 'Salary', metadata: {} });
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Sleep', metadata: {} });
      system.addEntry({ type: LOG_ENTRY_TYPES.EVENT, title: 'Another event', metadata: {} });
    });

    test('returns paginated results', () => {
      const result = system.getEntries({ limit: 2, offset: 0 });

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.hasMore).toBe(true);
      expect(result.entries[0].title).toBe('Walk');
      expect(result.entries[1].title).toBe('Random event');
    });

    test('returns second page correctly', () => {
      const result = system.getEntries({ limit: 2, offset: 2 });

      expect(result.entries).toHaveLength(2);
      expect(result.hasMore).toBe(true);
      expect(result.entries[0].title).toBe('Salary');
    });

    test('returns last page with hasMore=false', () => {
      const result = system.getEntries({ limit: 2, offset: 4 });

      expect(result.entries).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    test('filters by type', () => {
      const result = system.getEntries({ type: LOG_ENTRY_TYPES.ACTION });

      expect(result.entries).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.entries.every(e => e.type === 'action')).toBe(true);
    });

    test('filters by sinceTotalHours', () => {
      // Все записи имеют totalHours=100 (из мока)
      // Добавим запись с другим временем
      mockWorld.updateComponent('player', 'time', { totalHours: 200 });
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Late entry' });

      const result = system.getEntries({ sinceTotalHours: 150 });

      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].title).toBe('Late entry');
    });

    test('returns hasMore correctly', () => {
      // 5 записей, limit=5, offset=0 → hasMore=false
      const r1 = system.getEntries({ limit: 5 });
      expect(r1.hasMore).toBe(false);

      // limit=4, offset=0 → hasMore=true
      const r2 = system.getEntries({ limit: 4 });
      expect(r2.hasMore).toBe(true);

      // limit=3, offset=3 → hasMore=false (3+3>=5)
      const r3 = system.getEntries({ limit: 3, offset: 3 });
      expect(r3.hasMore).toBe(false);

      // limit=1, offset=3 → hasMore=true (3+1<5)
      const r4 = system.getEntries({ limit: 1, offset: 3 });
      expect(r4.hasMore).toBe(true);
    });

    test('returns empty result when no component', () => {
      const freshSystem = new ActivityLogSystem();
      freshSystem.world = createMockWorld();

      const result = freshSystem.getEntries();
      expect(result).toEqual({ entries: [], total: 0, hasMore: false });
    });
  });

  // ─── 4. getRecentEntries ─────────────────────────────────────────

  describe('getRecentEntries', () => {
    beforeEach(() => {
      system.init(mockWorld);
      for (let i = 0; i < 20; i++) {
        system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: `Entry ${i}` });
      }
    });

    test('returns last N entries', () => {
      const recent = system.getRecentEntries(5);

      expect(recent).toHaveLength(5);
      expect(recent[0].title).toBe('Entry 15');
      expect(recent[4].title).toBe('Entry 19');
    });

    test('returns all entries if count exceeds total', () => {
      const recent = system.getRecentEntries(100);
      expect(recent).toHaveLength(20);
    });

    test('returns last 10 by default', () => {
      const recent = system.getRecentEntries();
      expect(recent).toHaveLength(10);
    });

    test('returns empty array when no component', () => {
      const freshSystem = new ActivityLogSystem();
      freshSystem.world = createMockWorld();

      const result = freshSystem.getRecentEntries();
      expect(result).toEqual([]);
    });
  });

  // ─── 5. getEntriesByType ─────────────────────────────────────────

  describe('getEntriesByType', () => {
    beforeEach(() => {
      system.init(mockWorld);
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'A1' });
      system.addEntry({ type: LOG_ENTRY_TYPES.EVENT, title: 'E1' });
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'A2' });
      system.addEntry({ type: LOG_ENTRY_TYPES.FINANCE, title: 'F1' });
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'A3' });
    });

    test('filters entries by type', () => {
      const actions = system.getEntriesByType(LOG_ENTRY_TYPES.ACTION);
      expect(actions).toHaveLength(3);
      expect(actions.map(e => e.title)).toEqual(['A1', 'A2', 'A3']);
    });

    test('respects limit parameter', () => {
      const actions = system.getEntriesByType(LOG_ENTRY_TYPES.ACTION, 2);
      expect(actions).toHaveLength(2);
      // Возвращает последние 2 записи данного типа
      expect(actions[0].title).toBe('A2');
      expect(actions[1].title).toBe('A3');
    });

    test('returns empty array for type with no entries', () => {
      const result = system.getEntriesByType(LOG_ENTRY_TYPES.CAREER);
      expect(result).toEqual([]);
    });

    test('returns empty array when no component', () => {
      const freshSystem = new ActivityLogSystem();
      freshSystem.world = createMockWorld();

      const result = freshSystem.getEntriesByType(LOG_ENTRY_TYPES.ACTION);
      expect(result).toEqual([]);
    });
  });

  // ─── 6. eventBus integration ─────────────────────────────────────

  describe('eventBus integration', () => {
    beforeEach(() => {
      system.init(mockWorld);
    });

    test('activity:action event creates ACTION entry', () => {
      mockWorld.eventBus._dispatch('activity:action', {
        category: 'fun',
        title: 'Прогулка',
        description: 'Вышли на прогулку',
        icon: 'walk',
        metadata: { actionId: 'fun_park_walk' },
      });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].type).toBe(LOG_ENTRY_TYPES.ACTION);
      expect(log.entries[0].title).toBe('Прогулка');
      expect(log.entries[0].category).toBe('fun');
    });

    test('activity:event event creates EVENT entry', () => {
      mockWorld.eventBus._dispatch('activity:event', {
        title: 'Случайное событие',
        description: 'Что-то произошло',
      });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].type).toBe(LOG_ENTRY_TYPES.EVENT);
      expect(log.entries[0].title).toBe('Случайное событие');
    });

    test('activity:finance event creates FINANCE entry', () => {
      mockWorld.eventBus._dispatch('activity:finance', {
        title: 'Зарплата',
        description: 'Получили зарплату',
        metadata: { amount: 50000 },
      });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].type).toBe(LOG_ENTRY_TYPES.FINANCE);
      expect(log.entries[0].metadata).toEqual({ amount: 50000 });
    });

    test('activity:prevented event creates PREVENTED entry', () => {
      mockWorld.eventBus._dispatch('activity:prevented', {
        title: 'Действие заблокировано',
        description: 'Недостаточно энергии',
      });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].type).toBe(LOG_ENTRY_TYPES.PREVENTED);
    });

    test('activity:education event creates EDUCATION entry', () => {
      mockWorld.eventBus._dispatch('activity:education', {
        title: 'Поступление',
        description: 'Поступили в ВУЗ',
      });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].type).toBe(LOG_ENTRY_TYPES.EDUCATION);
    });

    test('event without detail creates entry with defaults', () => {
      mockWorld.eventBus._dispatch('activity:action');

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].category).toBeNull();
      expect(log.entries[0].title).toBe('');
      expect(log.entries[0].description).toBe('');
      expect(log.entries[0].icon).toBeNull();
      expect(log.entries[0].metadata).toEqual({});
    });
  });

  // ─── 7. destroy ──────────────────────────────────────────────────

  describe('destroy', () => {
    test('removes all eventBus listeners', () => {
      system.init(mockWorld);

      expect(system._listeners).toHaveLength(10);

      system.destroy();

      // Все 10 слушателей должны быть удалены
      expect(mockWorld.eventBus.removeEventListener).toHaveBeenCalledTimes(10);

      const expectedEvents = [
        'activity:action',
        'activity:event',
        'activity:stat',
        'activity:skill',
        'activity:finance',
        'activity:career',
        'activity:navigation',
        'activity:prevented',
        'activity:time',
        'activity:education',
      ];

      for (const eventName of expectedEvents) {
        expect(mockWorld.eventBus.removeEventListener).toHaveBeenCalledWith(
          eventName,
          expect.any(Function),
        );
      }

      // Внутренний массив очищен
      expect(system._listeners).toEqual([]);
    });

    test('does not throw when called without init', () => {
      const freshSystem = new ActivityLogSystem();
      expect(() => freshSystem.destroy()).not.toThrow();
    });

    test('stops receiving events after destroy', () => {
      system.init(mockWorld);
      system.destroy();

      // Диспетчеризуем событие после destroy
      mockWorld.eventBus._dispatch('activity:action', { title: 'After destroy' });

      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(0);
    });
  });

  // ─── 8. clearOldEntries ──────────────────────────────────────────

  describe('clearOldEntries', () => {
    test('removes entries older than maxAge', () => {
      system.init(mockWorld);

      // Добавляем записи с разным totalHours
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'Old' });
      mockWorld.updateComponent('player', 'time', { totalHours: 200 });
      system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'New' });

      const removed = system.clearOldEntries(150);

      expect(removed).toBe(1);
      const log = mockWorld.getComponent('player', 'activity_log');
      expect(log.entries).toHaveLength(1);
      expect(log.entries[0].title).toBe('New');
    });

    test('returns 0 when no component', () => {
      const freshSystem = new ActivityLogSystem();
      freshSystem.world = createMockWorld();

      const result = freshSystem.clearOldEntries(100);
      expect(result).toBe(0);
    });
  });

  // ─── 9. _getCurrentTimestamp fallback ────────────────────────────

  describe('_getCurrentTimestamp', () => {
    test('returns default values when TIME_COMPONENT is missing', () => {
      system.init(mockWorld);
      // Удаляем time компонент
      mockWorld._componentMap.delete('time');

      const entry = system.addEntry({ type: LOG_ENTRY_TYPES.ACTION, title: 'No time' });

      expect(entry.timestamp).toEqual({
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        hour: 0,
        totalHours: 0,
        age: 0,
      });
    });
  });
});
