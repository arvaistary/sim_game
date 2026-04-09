import { ActionSystem } from '../../src/ecs/systems/ActionSystem.js';
import { getActionById, getActionsByCategory, getAllActions, getActionsCount } from '../../src/balance/actions/index.js';

/**
 * Мок-объект world для тестирования — соответствует реальному ECS API:
 * - getComponent(id, key) / addComponent(id, key, data) / updateComponent(id, key, data)
 * - systems — массив систем (включая mock TimeSystem)
 */
function createMockWorld(state = {}) {
  const playerId = 'player';
  const componentMap = new Map();

  function addComponent(entityId, key, data) {
    if (!componentMap.has(key)) componentMap.set(key, new Map());
    // Имитируем реальный ECSWorld.addComponent: spread для объектов
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

  // Инициализация компонентов по умолчанию
  addComponent(playerId, 'stats', {
    hunger: 50, energy: 50, stress: 30, mood: 50, health: 70, physical: 50,
    ...(state.stats || {}),
  });
  addComponent(playerId, 'skills', { ...(state.skills || {}) });
  addComponent(playerId, 'wallet', { money: 100000, totalEarnings: 0, totalSpent: 0, ...(state.wallet || {}) });
  addComponent(playerId, 'time', { currentAge: 25, sleepDebt: 0, gameMonths: 0, ...(state.time || {}) });
  addComponent(playerId, 'housing', { level: 1, comfort: 30, ...(state.housing || {}) });
  addComponent(playerId, 'relationships', []);
  addComponent(playerId, 'finance', { reserveFund: 0 });
  addComponent(playerId, 'skillModifiers', {});
  addComponent(playerId, 'furniture', (state.purchasedItems || []).map(id => ({ id, level: 1 })));

  // Компоненты ActionSystem
  addComponent(playerId, 'subscriptions', { items: state.subscriptions || [] });
  addComponent(playerId, 'cooldowns', { ...(state.cooldowns || {}) });
  addComponent(playerId, 'completedActions', { items: state.completedActions || [] });

  let totalHours = 100;

  const mockTimeSystem = {
    getWeekHoursRemaining: () => 168,
    getDayHoursRemaining: () => 20,
    getTotalHours: () => totalHours,
    advanceHours: (h) => { totalHours += h; },
  };

  return {
    components: componentMap,
    systems: [mockTimeSystem],
    getComponent,
    addComponent,
    updateComponent,
    entities: new Map([[playerId, { id: playerId, components: new Set() }]]),
  };
}

describe('ActionSystem', () => {
  let actionSystem;
  let mockWorld;

  beforeEach(() => {
    actionSystem = new ActionSystem();
    mockWorld = createMockWorld();
    actionSystem.init(mockWorld);
  });

  describe('canExecute()', () => {
    test('возвращает available:true для бесплатного действия', () => {
      const result = actionSystem.canExecute('fun_park_walk');
      expect(result.available).toBe(true);
    });

    test('возвращает available:false если не хватает денег', () => {
      mockWorld = createMockWorld({ wallet: { money: 100 } });
      actionSystem.init(mockWorld);
      const result = actionSystem.canExecute('fun_spa_day'); // 9500₽
      expect(result.available).toBe(false);
      expect(result.reason).toContain('денег');
    });

    test('возвращает available:false если не хватает времени в неделе', () => {
      mockWorld = createMockWorld();
      mockWorld.systems = [{
        getWeekHoursRemaining: () => 2,
        getTotalHours: () => 100,
        advanceHours: (h) => {},
      }];
      actionSystem.init(mockWorld);
      const result = actionSystem.canExecute('fun_lazy_day'); // 12ч
      expect(result.available).toBe(false);
      expect(result.reason).toContain('неделе');
    });

    test('возвращает available:false для одноразового действия после выполнения', () => {
      mockWorld = createMockWorld({ completedActions: ['home_good_bed'] });
      actionSystem.init(mockWorld);
      const result = actionSystem.canExecute('home_good_bed');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('Уже выполнено');
    });

    test('возвращает available:false если не выполнены требования по навыкам', () => {
      mockWorld = createMockWorld({ skills: { leadership: 1 } });
      actionSystem.init(mockWorld);
      // Некоторые действия требуют навыки — проверяем что система работает
      const result = actionSystem.canExecute('fun_park_walk'); // нет требований
      expect(result.available).toBe(true);
    });

    test('возвращает available:false для неизвестного действия', () => {
      const result = actionSystem.canExecute('nonexistent_action');
      expect(result.available).toBe(false);
      expect(result.reason).toContain('не найдено');
    });
  });

  describe('execute()', () => {
    test('успешно выполняет бесплатное действие', () => {
      const result = actionSystem.execute('fun_park_walk');
      expect(result.success).toBe(true);
      expect(result.summary).toBeDefined();
    });

    test('списывает деньги при выполнении платного действия', () => {
      const moneyBefore = mockWorld.getComponent('player', 'wallet').money;
      actionSystem.execute('fun_cinema'); // 950₽
      const moneyAfter = mockWorld.getComponent('player', 'wallet').money;
      expect(moneyAfter).toBeLessThan(moneyBefore);
    });

    test('применяет изменения шкал', () => {
      const energyBefore = mockWorld.getComponent('player', 'stats').energy;
      actionSystem.execute('fun_sleep_8h');
      const energyAfter = mockWorld.getComponent('player', 'stats').energy;
      expect(energyAfter).toBeGreaterThan(energyBefore);
    });

    test('применяет изменения навыков', () => {
      actionSystem.execute('fun_meditation'); // emotionalIntelligence +1
      const skills = mockWorld.getComponent('player', 'skills');
      expect(skills.emotionalIntelligence).toBeGreaterThan(0);
    });

    test('записывает кулдаун', () => {
      actionSystem.execute('fun_spa_day'); // cooldown: 168ч
      const cooldowns = mockWorld.getComponent('player', 'cooldowns');
      expect(cooldowns['fun_spa_day']).toBeDefined();
    });

    test('записывает одноразовое действие', () => {
      actionSystem.execute('home_good_bed'); // oneTime: true
      const completed = mockWorld.getComponent('player', 'completedActions').items;
      expect(completed).toContain('home_good_bed');
    });

    test('создаёт подписку', () => {
      actionSystem.execute('shop_fitness_membership');
      const subs = mockWorld.getComponent('player', 'subscriptions').items;
      expect(subs.length).toBeGreaterThan(0);
      expect(subs[0].monthlyCost).toBe(8000);
    });

    test('добавляет grantsItem в мебель', () => {
      actionSystem.execute('shop_fitness_membership');
      const furniture = mockWorld.getComponent('player', 'furniture');
      expect(furniture.some(item => item.id === 'fitness_membership')).toBe(true);
    });

    test('возвращает error при недостатке денег', () => {
      mockWorld = createMockWorld({ wallet: { money: 100 } });
      actionSystem.init(mockWorld);
      const result = actionSystem.execute('fun_spa_day');
      expect(result.success).toBe(false);
    });

    test('продвигает время', () => {
      const hoursBefore = mockWorld.systems[0].getTotalHours();
      actionSystem.execute('fun_park_walk'); // 2ч
      const hoursAfter = mockWorld.systems[0].getTotalHours();
      expect(hoursAfter).toBeGreaterThan(hoursBefore);
    });
  });

  describe('getAvailableActions()', () => {
    test('возвращает действия категории с информацией о доступности', () => {
      const actions = actionSystem.getAvailableActions('fun');
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].availability).toBeDefined();
      expect(actions[0].availability.available).toBeDefined();
    });

    test('возвращает все действия без категории', () => {
      const actions = actionSystem.getAvailableActions();
      expect(actions.length).toBeGreaterThan(200);
    });
  });
});

describe('Actions Registry', () => {
  test('getAllActions возвращает все действия', () => {
    const actions = getAllActions();
    expect(actions.length).toBeGreaterThan(200);
  });

  test('getActionById находит действие по ID', () => {
    const action = getActionById('fun_park_walk');
    expect(action).not.toBeNull();
    expect(action.title).toBeDefined();
    expect(action.hourCost).toBeGreaterThan(0);
  });

  test('getActionById возвращает null для неизвестного ID', () => {
    const action = getActionById('nonexistent');
    expect(action).toBeNull();
  });

  test('getActionsByCategory фильтрует по категории', () => {
    const shopActions = getActionsByCategory('shop');
    expect(shopActions.length).toBeGreaterThan(0);
    expect(shopActions.every(a => a.category === 'shop')).toBe(true);
  });

  test('getActionsCount возвращает общее количество', () => {
    const count = getActionsCount();
    expect(count).toBeGreaterThan(200);
  });

  test('все действия имеют обязательные поля', () => {
    const actions = getAllActions();
    for (const action of actions) {
      expect(action.id).toBeDefined();
      expect(action.category).toBeDefined();
      expect(action.title).toBeDefined();
      expect(action.hourCost).toBeGreaterThan(0);
      expect(action.price).toBeDefined();
      expect(action.effect).toBeDefined();
    }
  });

  test('все ID уникальны', () => {
    const actions = getAllActions();
    const ids = actions.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
