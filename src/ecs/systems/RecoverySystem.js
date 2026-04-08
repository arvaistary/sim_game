import { 
  TIME_COMPONENT, 
  STATS_COMPONENT, 
  SKILLS_COMPONENT, 
  WALLET_COMPONENT, 
  HOUSING_COMPONENT, 
  FURNITURE_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  EDUCATION_COMPONENT,
  CAREER_COMPONENT,
  PLAYER_ENTITY 
} from '../components/index.js';
import { HOUSING_LEVELS } from '../../balance/housing-levels.js';

/**
 * Система обработки действий восстановления
 * Обрабатывает магазин, развлечения, дом, обучение, соц. жизнь, финансы
 */
export class RecoverySystem {
  constructor() {
    this.housingLevels = HOUSING_LEVELS;
  }

  init(world) {
    this.world = world;
  }

  /**
   * Совместимость: поиск карточки в табе и применение (устаревший API).
   * @param {string} playerId
   * @param {{ cards?: Array<Record<string, unknown>> }} tab
   * @param {string} [cardId]
   */
  recover(playerId, tab, cardId) {
    if (!tab?.cards?.length) return '';
    const card =
      tab.cards.find((c) => c.id === cardId) ||
      tab.cards.find((c) => c.title === cardId) ||
      null;
    if (!card) return '';
    return this.applyRecoveryAction(card);
  }

  /**
   * Применить действие восстановления
   */
  applyRecoveryAction(cardData) {
    const playerId = PLAYER_ENTITY;
    
    const passive = this._getPassiveBonuses();
    const statChanges = { ...(cardData.statChanges ?? {}) };
    const isAssetTransfer = Boolean(cardData.reserveDelta || cardData.investmentReturn);

    // Применяем пассивные бонусы к еде
    if (cardData.title.includes('перекус') || cardData.title.includes('обед')) {
      statChanges.hunger = Math.round((statChanges.hunger ?? 0) * passive.foodRecoveryMultiplier);
    }

    // Применяем пассивный бонус настроения для вечера дома
    if (cardData.title === 'Вечер дома') {
      statChanges.mood = (statChanges.mood ?? 0) + passive.homeMoodBonus;
    }

    // Применяем финансовые изменения
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    wallet.money -= cardData.price;
    
    if (!isAssetTransfer) {
      wallet.totalSpent += cardData.price;
    }

    // Применяем изменения статов
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    this._applyStatChanges(stats, statChanges);

    // Применяем изменения навыков
    if (cardData.skillChanges) {
      const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
      this._applySkillChanges(skills, cardData.skillChanges);
    }

    // Обновление комфорта жилья
    if (cardData.housingComfortDelta) {
      const housing = this.world.getComponent(playerId, HOUSING_COMPONENT);
      housing.comfort = this._clamp(housing.comfort + cardData.housingComfortDelta);
    }

    // Улучшение уровня жилья
    if (cardData.housingUpgradeLevel) {
      this._upgradeHousing(cardData.housingUpgradeLevel);
    }

    // Добавление мебели
    if (cardData.furnitureId) {
      this._addFurniture(cardData.furnitureId);
    }

    // Обновление отношений
    if (cardData.relationshipDelta) {
      this._applyRelationshipDelta(cardData.relationshipDelta);
    }

    // Резервный фонд
    if (cardData.reserveDelta) {
      const finance = this.world.getComponent(playerId, 'finance');
      finance.reserveFund = Math.max(0, (finance?.reserveFund ?? 0) + cardData.reserveDelta);
    }

    // Открытие инвестиции
    if (cardData.investmentReturn) {
      this._openInvestment(cardData);
    }

    // Множитель зарплаты
    if (cardData.salaryMultiplierDelta) {
      const career = this.world.getComponent(playerId, CAREER_COMPONENT);
      career.salaryPerDay = Math.round(career.salaryPerDay * (1 + cardData.salaryMultiplierDelta));
      career.salaryPerWeek = career.salaryPerDay * 5;
    }

    // Уровень образования
    if (cardData.educationLevel) {
      const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
      education.educationLevel = cardData.educationLevel;
      education.institute = 'completed';
    }

    // Продвижение времени
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    const dayCost = cardData.dayCost ?? 1;
    time.gameDays += dayCost;
    time.gameWeeks = Math.max(1, Math.floor(time.gameDays / 7));
    time.gameMonths = Math.max(1, Math.floor(time.gameDays / 30));
    time.gameYears = Number((time.gameDays / 360).toFixed(1));
    time.currentAge = time.startAge + Math.floor(time.gameDays / 360);

    return this._buildRecoverySummary(cardData, statChanges);
  }

  /**
   * Получить пассивные бонусы
   */
  _getPassiveBonuses() {
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
    const comfortRatio = this._clamp((housing?.comfort ?? 0) / 100, 0, 1);
    const housingLevel = housing?.level ?? 1;
    const furniture = this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || [];

    return {
      foodRecoveryMultiplier: (this._hasFurniture(furniture, 'refrigerator') ? 1.2 : 1) + comfortRatio * 0.08,
      workEnergyMultiplier: Math.max(0.78, (this._hasFurniture(furniture, 'good_bed') ? 0.9 : 1) - comfortRatio * 0.08 - (housingLevel - 1) * 0.02),
      homeMoodBonus: (this._hasFurniture(furniture, 'decor_light') ? 6 : 0) + Math.round(comfortRatio * 4) + (housingLevel - 1) * 2,
    };
  }

  /**
   * Проверить наличие мебели
   */
  _hasFurniture(furniture, furnitureId) {
    return Boolean(furniture?.some(item => item.id === furnitureId));
  }

  /**
   * Улучшить уровень жилья
   */
  _upgradeHousing(targetLevel) {
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
    const finance = this.world.getComponent(PLAYER_ENTITY, 'finance');
    
    const tier = this.housingLevels.find(item => item.level === targetLevel);
    if (!tier) return;

    housing.level = tier.level;
    housing.name = tier.name;
    housing.comfort = Math.max(housing.comfort, tier.baseComfort);
    finance.monthlyExpenses.housing = tier.monthlyHousingCost;
  }

  /**
   * Добавить мебель
   */
  _addFurniture(furnitureId) {
    const furniture = this.world.getComponent(PLAYER_ENTITY, FURNITURE_COMPONENT) || [];
    const housing = this.world.getComponent(PLAYER_ENTITY, HOUSING_COMPONENT);
    
    if (!this._hasFurniture(furniture, furnitureId)) {
      furniture.push({ id: furnitureId, level: 1 });
      this.world.updateComponent(PLAYER_ENTITY, FURNITURE_COMPONENT, furniture);
    }
  }

  /**
   * Применить дельту отношений
   */
  _applyRelationshipDelta(delta) {
    if (!delta) return;

    const relationships = this.world.getComponent(PLAYER_ENTITY, RELATIONSHIPS_COMPONENT);
    if (!relationships || !relationships.length) return;

    const firstRelationship = relationships[0];
    firstRelationship.level = this._clamp(firstRelationship.level + delta);
    firstRelationship.lastContact = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT).gameDays;
  }

  /**
   * Открыть инвестицию
   */
  _openInvestment(cardData) {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT);
    const investments = this.world.getComponent(PLAYER_ENTITY, 'investment') || [];
    
    const newInvestment = {
      id: `deposit_${investments.length + 1}`,
      type: 'deposit',
      label: cardData.title,
      amount: cardData.price,
      startDate: time.gameDays,
      durationDays: cardData.investmentDurationDays ?? 28,
      maturityDay: time.gameDays + (cardData.investmentDurationDays ?? 28),
      expectedReturn: cardData.investmentReturn ?? 0,
      totalEarned: 0,
      status: 'active',
    };

    investments.push(newInvestment);
    this.world.updateComponent(PLAYER_ENTITY, 'investment', investments);
  }

  /**
   * Построить резюме восстановления
   */
  _buildRecoverySummary(cardData, statChanges) {
    const changes = this._summarizeStatChanges(statChanges);
    return [
      `${cardData.title} завершено.`,
      `Потрачено: ${this._formatMoney(cardData.price)} ₽ • Время: ${cardData.dayCost} д.`,
      changes || 'Шкалы без заметных изменений.',
    ].join('\n');
  }

  /**
   * Суммировать изменения статов
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
   * Применить изменения статов
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
