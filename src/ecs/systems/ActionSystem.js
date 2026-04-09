import { getActionById, getActionsByCategory, getAllActions } from '../../balance/actions/index.js';
import { calculateStatChanges } from '../../balance/hourly-rates.js';
import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  WALLET_COMPONENT,
  HOUSING_COMPONENT,
  FURNITURE_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  FINANCE_COMPONENT,
  SUBSCRIPTION_COMPONENT,
  COOLDOWN_COMPONENT,
  COMPLETED_ACTIONS_COMPONENT,
} from '../components/index.js';
import { StatsSystem } from './StatsSystem.js';
import { SkillsSystem } from './SkillsSystem.js';

/**
 * Система выполнения действий игрока
 * Обрабатывает покупки, развлечения, дом, обучение, соц. жизнь, финансы
 * Следует ECS-архитектуре: читает/пишет компоненты через world.getComponent/addComponent
 */
export class ActionSystem {
  constructor() {
    this.world = null;
    this.statsSystem = null;
    this.skillsSystem = null;
  }

  init(world) {
    this.world = world;

    // Создаём вложенные системы для делегирования (паттерн из RecoverySystem)
    this.statsSystem = new StatsSystem();
    this.statsSystem.init(world);
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);

    // Инициализация ECS-компонентов если их нет
    this._ensureComponent(SUBSCRIPTION_COMPONENT, { items: [] });
    this._ensureComponent(COOLDOWN_COMPONENT, {});
    this._ensureComponent(COMPLETED_ACTIONS_COMPONENT, { items: [] });
  }

  // === Проверка доступности ===

  /**
   * Проверить, может ли игрок выполнить действие.
   * @param {string} actionId - ID действия
   * @returns {{ available: boolean, reason?: string }}
   */
  canExecute(actionId) {
    const action = getActionById(actionId);
    if (!action) return { available: false, reason: 'Действие не найдено' };

    // Проверка денег
    if (action.price > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT);
      const money = wallet?.money ?? 0;
      if (money < action.price) {
        return { available: false, reason: `Не хватает денег (${action.price}₽)` };
      }
    }

    // Проверка времени
    const timeSystem = this._getTimeSystem();
    if (timeSystem && timeSystem.getDayHoursRemaining) {
      const remaining = timeSystem.getDayHoursRemaining();
      if (action.hourCost > remaining) {
        return { available: false, reason: `Не хватает времени (${action.hourCost}ч нужно, ${remaining.toFixed(1)}ч осталось)` };
      }
    }

    // Проверка одноразовости
    if (action.oneTime) {
      const completedActions = this.world.getComponent(PLAYER_ENTITY, COMPLETED_ACTIONS_COMPONENT);
      const items = completedActions?.items || [];
      if (items.includes(actionId)) {
        return { available: false, reason: 'Уже выполнено' };
      }
    }

    // Проверка кулдауна
    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT);
      if (cooldowns?.[actionId]) {
        const ts = this._getTimeSystem();
        if (ts && ts.getTotalHours) {
          const elapsed = ts.getTotalHours() - cooldowns[actionId];
          if (elapsed < action.cooldown.hours) {
            const remaining = action.cooldown.hours - elapsed;
            return { available: false, reason: `Кулдаун: ${remaining.toFixed(0)}ч осталось` };
          }
        }
      }
    }

    // Проверка requirements
    if (action.requirements) {
      const req = action.requirements;

      // Минимальный возраст
      if (req.minAge) {
        const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
        const currentAge = time?.currentAge ?? 0;
        if (currentAge < req.minAge) {
          return { available: false, reason: `Нужен возраст ${req.minAge}+` };
        }
      }

      // Минимальные навыки
      if (req.minSkills) {
        const skills = this.world.getComponent(PLAYER_ENTITY, SKILLS_COMPONENT);
        for (const [skillKey, minValue] of Object.entries(req.minSkills)) {
          if ((skills?.[skillKey] ?? 0) < minValue) {
            return { available: false, reason: `Нужен навык ${skillKey} ≥ ${minValue}` };
          }
        }
      }

      // Уровень жилья
      if (req.housingLevel) {
        const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
        if ((housing?.level ?? 0) < req.housingLevel) {
          return { available: false, reason: `Нужен уровень жилья ≥ ${req.housingLevel}` };
        }
      }

      // Требуется предмет
      if (req.requiresItem) {
        const items = this._getFurnitureItems();
        if (!items.some(item => item.id === req.requiresItem)) {
          return { available: false, reason: `Нужен предмет: ${req.requiresItem}` };
        }
      }

      // Требуются отношения
      if (req.requiresRelationship) {
        const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT);
        const hasRelationship = Array.isArray(relationships)
          ? relationships.length > 0 && relationships[0]?.level > 0
          : relationships?.level > 0;
        if (!hasRelationship) {
          return { available: false, reason: 'Нужны отношения' };
        }
      }
    }

    return { available: true };
  }

  // === Выполнение действия ===

  /**
   * Выполнить действие.
   * @param {string} actionId - ID действия
   * @returns {{ success: boolean, summary?: string, error?: string }}
   */
  execute(actionId) {
    // Проверка доступности
    const check = this.canExecute(actionId);
    if (!check.available) {
      return { success: false, error: check.reason };
    }

    const action = getActionById(actionId);
    if (!action) return { success: false, error: 'Действие не найдено' };

    // 1. Списать деньги
    if (action.price > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT);
      if (wallet) {
        wallet.money -= action.price;
      }
    }

    // 2. Рассчитать и применить изменения шкал
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
    const currentAge = time?.currentAge ?? 25;
    const sleepDebt = time?.sleepDebt ?? 0;
    const modifiers = this.skillsSystem.getModifiers();

    const statChanges = calculateStatChanges(
      action.actionType || 'neutral',
      action.hourCost,
      action.statChanges || {},
      modifiers,
      currentAge,
      sleepDebt
    );

    this.statsSystem.applyStatChanges(statChanges);

    // 3. Применить изменения навыков через SkillsSystem
    if (action.skillChanges) {
      this.skillsSystem.applySkillChanges(action.skillChanges, 'action');
    }

    // 4. Применить жилищные эффекты
    if (action.housingComfortDelta) {
      const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
      if (housing) {
        housing.comfort = this._clamp((housing.comfort ?? 0) + action.housingComfortDelta);
      }
    }
    if (action.housingUpgradeLevel !== undefined) {
      const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
      if (housing) {
        housing.level = action.housingUpgradeLevel;
      }
    }

    // 5. Применить эффекты отношений
    if (action.relationshipDelta) {
      const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT);
      if (Array.isArray(relationships) && relationships.length > 0) {
        relationships[0].level = this._clamp(relationships[0].level + action.relationshipDelta);
      }
    }

    // 6. Применить финансовые эффекты
    if (action.reserveDelta) {
      const finance = this.world.getComponent(PLAYER_ENTITY, FINANCE_COMPONENT);
      if (finance) {
        finance.reserveFund = Math.max(0, (finance.reserveFund ?? 0) + action.reserveDelta);
      }
    }

    // 7. Продвинуть время
    const timeSystem = this._getTimeSystem();
    if (timeSystem && timeSystem.advanceHours) {
      timeSystem.advanceHours(action.hourCost);
    }

    // 8. Записать кулдаун
    if (action.cooldown) {
      const cooldowns = this.world.getComponent(PLAYER_ENTITY, COOLDOWN_COMPONENT);
      if (cooldowns) {
        cooldowns[actionId] = timeSystem ? timeSystem.getTotalHours() : 0;
      }
    }

    // 9. Записать одноразовое действие
    if (action.oneTime) {
      const completedActions = this.world.getComponent(PLAYER_ENTITY, COMPLETED_ACTIONS_COMPONENT);
      if (completedActions) {
        const items = completedActions.items || [];
        if (!items.includes(actionId)) {
          items.push(actionId);
        }
      }
    }

    // 10. Создать подписку
    if (action.subscription) {
      const subscriptions = this.world.getComponent(PLAYER_ENTITY, SUBSCRIPTION_COMPONENT);
      const timeComp = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
      if (subscriptions) {
        const items = subscriptions.items || [];
        items.push({
          actionId: actionId,
          monthlyCost: action.subscription.monthlyCost,
          effectPerWeek: action.subscription.effectPerWeek || null,
          startMonth: timeComp?.gameMonths ?? 0,
        });
      }
    }

    // 11. Обработка grantsItem (универсальная замена хардкода shop_fitness_membership)
    if (action.grantsItem) {
      this._addFurnitureItem(action.grantsItem);
    }

    // Формировать summary
    const parts = [];
    if (statChanges) {
      for (const [key, val] of Object.entries(statChanges)) {
        if (val !== 0) parts.push(`${key}: ${val > 0 ? '+' : ''}${val.toFixed(1)}`);
      }
    }
    if (action.skillChanges) {
      for (const [key, val] of Object.entries(action.skillChanges)) {
        parts.push(`${key}: +${val}`);
      }
    }

    // Логирование действия в ActivityLog
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:action', {
        detail: {
          category: action.category || action.actionSource || 'general',
          title: `📝 ${action.label || action.name || action.id}`,
          description: parts.join(', ') || action.effect || '',
          icon: action.icon || null,
          metadata: {
            actionId: action.id,
            statChanges,
            moneyDelta: -(action.price || 0),
            skillChanges: action.skillChanges || null,
            hoursSpent: action.hourCost || 0,
          },
        },
      }));
    }

    return {
      success: true,
      summary: parts.join(', ') || action.effect,
    };
  }

  // === Получение действий ===

  getAvailableActions(categoryId) {
    const actions = categoryId
      ? getActionsByCategory(categoryId)
      : getAllActions();

    return actions.map(action => ({
      ...action,
      availability: this.canExecute(action.id),
    }));
  }

  getActionById(actionId) {
    return getActionById(actionId);
  }

  // === Подписки ===

  processSubscriptions() {
    const subscriptions = this.world.getComponent(PLAYER_ENTITY, SUBSCRIPTION_COMPONENT);
    if (!subscriptions?.items?.length) return;

    let totalCost = 0;
    for (const sub of subscriptions.items) {
      totalCost += sub.monthlyCost;

      // Применить еженедельные эффекты (4 раза в месяц)
      if (sub.effectPerWeek) {
        if (sub.effectPerWeek.statChanges) {
          this.statsSystem.applyStatChanges(sub.effectPerWeek.statChanges);
        }
        if (sub.effectPerWeek.skillChanges) {
          this.skillsSystem.applySkillChanges(sub.effectPerWeek.skillChanges, 'subscription');
        }
      }
    }

    if (totalCost > 0) {
      const wallet = this.world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT);
      if (wallet) {
        wallet.money -= totalCost;
      }
    }
  }

  // === Приватные методы ===

  /**
   * Инициализировать компонент значением по умолчанию, если его нет
   */
  _ensureComponent(key, defaultValue) {
    const existing = this.world.getComponent(PLAYER_ENTITY, key);
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, key, defaultValue);
    }
  }

  /**
   * Получить TimeSystem из world.systems (паттерн из RecoverySystem)
   */
  _getTimeSystem() {
    return this.world.systems.find(s => typeof s.advanceHours === 'function') || null;
  }

  /**
   * Получить массив предметов из FURNITURE_COMPONENT.
   * Обрабатывает оба формата: массив и объект с числовыми ключами
   * (addComponent делает { ...array }, что превращает массив в объект).
   */
  _getFurnitureItems() {
    const data = this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT);
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.values(data);
  }

  /**
   * Добавить предмет в FURNITURE_COMPONENT.
   * Использует прямую запись в component map для сохранения формата массива.
   */
  _addFurnitureItem(itemId) {
    const items = this._getFurnitureItems();
    if (items.some(item => item.id === itemId)) return;
    items.push({ id: itemId, level: 1 });
    // Direct map set to preserve array format (addComponent spreads arrays into objects)
    if (!this.world.components.has(FURNITURE_COMPONENT)) {
      this.world.components.set(FURNITURE_COMPONENT, new Map());
      const entity = this.world.entities.get(PLAYER_ENTITY);
      if (entity) entity.components.add(FURNITURE_COMPONENT);
    }
    this.world.components.get(FURNITURE_COMPONENT).set(PLAYER_ENTITY, items);
  }

  /**
   * Ограничить значение
   */
  _clamp(value, min = 0, max = 100) {
    return Math.max(min, Math.min(max, value));
  }
}
