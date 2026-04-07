import { 
  WALLET_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  HOUSING_COMPONENT,
  FINANCE_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';

/**
 * Система обработки выборов событий
 * Применяет последствия выборов событий к состоянию игрока
 */
export class EventChoiceSystem {
  constructor() {
    this.choiceHandlers = new Map();
  }

  init(world) {
    this.world = world;
  }

  /**
   * Применить выбор события
   */
  applyEventChoice(event, choiceIndex) {
    const choice = event?.choices?.[choiceIndex];
    if (!event || !choice) {
      return { success: false, message: 'Событие или выбор не найден' };
    }

    const playerId = PLAYER_ENTITY;

    // Применяем финансовые изменения
    if (choice.moneyDelta !== undefined) {
      const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
      if (wallet) {
        wallet.money += choice.moneyDelta;
        if (choice.moneyDelta > 0) {
          wallet.totalEarnings = (wallet.totalEarnings ?? 0) + choice.moneyDelta;
        } else if (choice.moneyDelta < 0) {
          wallet.totalSpent = (wallet.totalSpent ?? 0) + Math.abs(choice.moneyDelta);
        }
      }
    }

    // Применяем изменения статы
    if (choice.statChanges) {
      const stats = this.world.getComponent(playerId, STATS_COMPONENT);
      if (stats) {
        this._applyStatChanges(stats, choice.statChanges);
      }
    }

    // Применяем изменения навыков
    if (choice.skillChanges) {
      const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
      if (skills) {
        this._applySkillChanges(skills, choice.skillChanges);
      }
    }

    // Применяем изменения отношений
    if (choice.relationshipDelta) {
      const relationships = this.world.getComponent(playerId, 'relationships');
      if (relationships && relationships.length > 0) {
        this._applyRelationshipDelta(relationships[0], choice.relationshipDelta);
      }
    }

    // Применяем изменения расходов
    if (choice.monthlyExpenseDelta) {
      const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);
      if (finance && finance.monthlyExpenses) {
        Object.entries(choice.monthlyExpenseDelta).forEach(([key, value]) => {
          const currentValue = finance.monthlyExpenses[key] ?? 0;
          finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
        });
      }
    }

    // Применяем изменения уровня жилья
    if (choice.housingLevelDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT);
      if (housing) {
        this._applyHousingLevelDelta(housing, choice.housingLevelDelta);
      }
    }

    // Записываем событие в историю
    this._recordEvent(event.id, event.title);

    // Удаляем событие из очереди
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    if (eventQueue && eventQueue.pendingEvents) {
      const index = eventQueue.pendingEvents.findIndex(e => e.id === event.id);
      if (index > -1) {
        eventQueue.pendingEvents.splice(index, 1);
      }
    }

    // Создаем описание результата
    const message = this._buildEventResultMessage(event, choice);

    return { success: true, message };
  }

  /**
   * Записать событие в историю
   */
  _recordEvent(eventId, title) {
    const playerId = PLAYER_ENTITY;
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);

    if (!time || !eventHistory) {
      return;
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
  }

  /**
   * Применить изменения статы
   */
  _applyStatChanges(stats, statChanges = {}) {
    for (const [key, value] of Object.entries(statChanges)) {
      stats[key] = this._clamp((stats[key] ?? 0) + value);
    }
  }

  /**
   * Применить изменения навыков
   */
  _applySkillChanges(skills, skillChanges = {}) {
    for (const [key, value] of Object.entries(skillChanges)) {
      skills[key] = this._clamp((skills[key] ?? 0) + value, 0, 10);
    }
  }

  /**
   * Применить дельту отношений
   */
  _applyRelationshipDelta(relationship, delta) {
    if (!relationship) {
      return;
    }
    relationship.level = this._clamp(relationship.level + delta);
  }

  /**
   * Применить дельту уровня жилья
   */
  _applyHousingLevelDelta(housing, delta) {
    const currentLevel = housing.level ?? 1;
    const newLevel = Math.max(1, Math.min(3, currentLevel + delta));
    
    // Обновляем уровень и название
    housing.level = newLevel;
    const housingLevels = [
      { level: 1, name: 'Студия', baseComfort: 35, monthlyHousingCost: 16000 },
      { level: 2, name: '1-комнатная квартира', baseComfort: 52, monthlyHousingCost: 26000 },
      { level: 3, name: 'Уютная квартира', baseComfort: 72, monthlyHousingCost: 38000 },
    ];
    
    const tier = housingLevels.find(t => t.level === newLevel) || housingLevels[0];
    housing.name = tier.name;
    housing.comfort = Math.max(housing.comfort, tier.baseComfort);
    
    // Обновляем расходы
    const finance = this.world.getComponent(PLAYER_ENTITY, FINANCE_COMPONENT);
    if (finance && finance.monthlyExpenses) {
      finance.monthlyExpenses.housing = tier.monthlyHousingCost;
    }
  }

  /**
   * Построить сообщение с результатом события
   */
  _buildEventResultMessage(event, choice) {
    const lines = [
      `${event.title}`,
      choice.outcome,
    ];

    if (choice.statChanges) {
      lines.push(this._summarizeStatChanges(choice.statChanges));
    }

    if (choice.moneyDelta !== undefined && choice.moneyDelta !== 0) {
      lines.push(`Деньги ${choice.moneyDelta > 0 ? '+' : ''}${this._formatMoney(choice.moneyDelta)} ₽`);
    }

    if (choice.skillChanges) {
      const skillLines = Object.entries(choice.skillChanges)
        .map(([key, value]) => `${key}: ${value > 0 ? '+' : ''}${value}`)
        .join(' • ');
      if (skillLines) {
        lines.push(`Навыки: ${skillLines}`);
      }
    }

    return lines.filter(Boolean).join('\n');
  }

  /**
   * Суммировать изменения статы
   */
  _summarizeStatChanges(statChanges = {}) {
    const defs = [
      ['hunger', 'Голод'],
      ['energy', 'Энергия'],
      ['stress', 'Стресс'],
      ['mood', 'Настроение'],
      ['health', 'Здоровье'],
      ['physical', 'Форма'],
    ];

    return defs
      .filter(([key]) => statChanges?.[key])
      .map(([key, label]) => `${label} ${statChanges[key] > 0 ? '+' : ''}${statChanges[key]}`)
      .join(' • ');
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
