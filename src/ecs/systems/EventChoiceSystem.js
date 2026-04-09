import { 
  WALLET_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  HOUSING_COMPONENT,
  FINANCE_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { SkillsSystem } from './SkillsSystem.js';
import { formatStatChangesBulletListRu } from '../../shared/stat-changes-format.js';

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
    this.skillsSystem = new SkillsSystem();
    this.skillsSystem.init(world);
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
    const resolvedChoice = this._resolveChoiceBySkillCheck(choice, event);
    const mergedStatChanges = this._mergeStatImpactWithChoice(event, resolvedChoice.statChanges);
    const resolvedForMessage = { ...resolvedChoice, statChanges: mergedStatChanges };

    // Применяем финансовые изменения
    if (resolvedChoice.moneyDelta !== undefined) {
      const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
      if (wallet) {
        wallet.money += resolvedChoice.moneyDelta;
        if (resolvedChoice.moneyDelta > 0) {
          wallet.totalEarnings = (wallet.totalEarnings ?? 0) + resolvedChoice.moneyDelta;
        } else if (resolvedChoice.moneyDelta < 0) {
          wallet.totalSpent = (wallet.totalSpent ?? 0) + Math.abs(resolvedChoice.moneyDelta);
        }
      }
    }

    // Применяем изменения статы (база события + выбор)
    if (mergedStatChanges && Object.keys(mergedStatChanges).length > 0) {
      const stats = this.world.getComponent(playerId, STATS_COMPONENT);
      if (stats) {
        this._applyStatChanges(stats, this._applyEventModifiers(mergedStatChanges));
      }
    }

    // Применяем изменения навыков
    if (resolvedChoice.skillChanges) {
      this.skillsSystem.applySkillChanges(resolvedChoice.skillChanges, `event:${event.id}`);
    }

    // Применяем изменения отношений
    if (resolvedChoice.relationshipDelta) {
      const relationships = this.world.getComponent(playerId, 'relationships');
      if (relationships && relationships.length > 0) {
        this._applyRelationshipDelta(relationships[0], resolvedChoice.relationshipDelta);
      }
    }

    // Применяем изменения расходов
    if (resolvedChoice.monthlyExpenseDelta) {
      const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);
      if (finance && finance.monthlyExpenses) {
        Object.entries(resolvedChoice.monthlyExpenseDelta).forEach(([key, value]) => {
          const currentValue = finance.monthlyExpenses[key] ?? 0;
          finance.monthlyExpenses[key] = Math.max(0, currentValue + value);
        });
      }
    }

    // Применяем изменения уровня жилья
    if (resolvedChoice.housingLevelDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT);
      if (housing) {
        this._applyHousingLevelDelta(housing, resolvedChoice.housingLevelDelta);
      }
    }

    // Логирование события в ActivityLog
    if (this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:event', {
        detail: {
          category: event.type || event.actionSource || 'random',
          title: `⚡ ${event.title}`,
          description: (event.description || event.title) + ' → ' + (choice.text || choice.outcome || ''),
          icon: null,
          metadata: {
            eventId: event.id,
            instanceId: event.instanceId,
            choiceIndex,
            choiceText: choice.text || choice.outcome || '',
            statChanges: mergedStatChanges && Object.keys(mergedStatChanges).length ? mergedStatChanges : null,
            moneyDelta: resolvedChoice.moneyDelta || 0,
            skillChanges: resolvedChoice.skillChanges || null,
          },
        },
      }));
    }

    // Записываем событие в историю
    this._recordEvent(event.id, event.title, event.type ?? 'story', event.actionSource ?? null);

    // Удаляем событие из очереди
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    if (eventQueue && eventQueue.pendingEvents) {
      const index = eventQueue.pendingEvents.findIndex(
        (e) => e.instanceId === event.instanceId || e.id === event.id,
      );
      if (index > -1) {
        eventQueue.pendingEvents.splice(index, 1);
      }
    }

    // Создаем описание результата
    const message = this._buildEventResultMessage(event, resolvedForMessage);

    return { success: true, message };
  }

  _mergeStatImpactWithChoice(event, choiceStatChanges) {
    const base =
      event?.statImpact && typeof event.statImpact === 'object' ? { ...event.statImpact } : {};
    const extra =
      choiceStatChanges && typeof choiceStatChanges === 'object' ? choiceStatChanges : {};
    const merged = { ...base };
    for (const [k, v] of Object.entries(extra)) {
      if (typeof v === 'number' && typeof merged[k] === 'number') {
        merged[k] = merged[k] + v;
      } else {
        merged[k] = v;
      }
    }
    return merged;
  }

  /**
   * Записать событие в историю
   */
  _recordEvent(eventId, title, type = 'story', actionSource = null) {
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
      week: time.gameWeeks,
      timestampHours: time.totalHours ?? (time.gameDays ?? 0) * 24,
      type,
      actionSource,
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
  _applyEventModifiers(statChanges = {}) {
    const reduction = this.skillsSystem.getModifiers().negativeEventPenaltyReduction ?? 0;
    const adjusted = {};

    for (const [key, value] of Object.entries(statChanges)) {
      adjusted[key] = typeof value === 'number' && value < 0
        ? Math.round(value * (1 - reduction))
        : value;
    }

    return adjusted;
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
    return formatStatChangesBulletListRu(statChanges);
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

  _resolveChoiceBySkillCheck(choice, event = null) {
    if (!choice?.skillCheck) return choice;

    const skills = this.world.getComponent(PLAYER_ENTITY, SKILLS_COMPONENT) || {};
    const check = choice.skillCheck;
    const skillValue = Number(skills[check.key] ?? 0);
    const passed = skillValue >= Number(check.threshold ?? 0);

    // Логирование предотвращения события через навык
    if (passed && this.world && this.world.eventBus) {
      this.world.eventBus.dispatchEvent(new CustomEvent('activity:prevented', {
        detail: {
          category: 'skill_prevented',
          title: `🛡️ Навык предотвратил: ${event?.title || 'Событие'}`,
          description: `Навык "${check.key}" (${skillValue}) превысил порог ${check.threshold}. Исход изменён.`,
          icon: null,
          metadata: {
            eventId: event?.id || null,
            skillName: check.key,
            skillLevel: skillValue,
            threshold: Number(check.threshold ?? 0),
            originalOutcome: choice.outcome || '',
            newOutcome: check.successStatChanges ? JSON.stringify(check.successStatChanges) : '',
          },
        },
      }));
    }

    return {
      ...choice,
      statChanges: passed ? (check.successStatChanges ?? choice.statChanges ?? {}) : (check.failStatChanges ?? choice.statChanges ?? {}),
      moneyDelta: passed ? (check.successMoneyDelta ?? choice.moneyDelta) : (check.failMoneyDelta ?? choice.moneyDelta),
      outcome: `${choice.outcome}${passed ? ' Удалось справиться.' : ' Подготовки не хватило.'}`,
    };
  }
}
