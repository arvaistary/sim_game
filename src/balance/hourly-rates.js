/**
 * Базовые почасовые ставки изменения шкал за 1 час по типу активности.
 * Источник: GDD 04_balance.md, раздел 5.2
 */
export const HOURLY_RATES = {
  work: {
    hunger: -2.2,
    energy: -2.7,
    stress: 1.9,
    mood: -1.0,
    health: -0.25,
    physical: -0.5,
  },
  neutral: {
    hunger: -1.4,
    energy: -1.6,
    stress: 0.6,
    mood: 0.4,
    health: -0.1,
    physical: -0.2,
  },
  sleep: {
    hunger: -0.6,
    energy: 6.8,
    stress: -3.1,
    mood: 2.5,
    health: 0.2,
    physical: 0.1,
  },
};

/**
 * Контрольные значения для баланса
 */
export const BALANCE_CONSTANTS = {
  HOURS_PER_DAY: 24,
  HOURS_PER_WEEK: 168,
  SLEEP_HOURS_RECOMMENDED: 8,
  SLEEP_HOURS_MINIMUM: 7,
  WORK_HOURS_STANDARD: 8,
  AGE_PENALTY_START: 40,
  AGE_PENALTY_RATE: 0.0075, // +0.75% за каждый год после 40
  MODIFIER_MIN: -0.40,      // -40%
  MODIFIER_MAX: 0.30,       // +30%
};

/**
 * Рассчитать множитель возрастных штрафов.
 * После 40 лет все негативные изменения увеличиваются на 0.75% за каждый год.
 * @param {number} currentAge - текущий возраст персонажа
 * @returns {number} множитель (1.0 = нет штрафа)
 */
export function getAgingPenalty(currentAge) {
  if (currentAge < BALANCE_CONSTANTS.AGE_PENALTY_START) return 1.0;
  return 1.0 + (currentAge - BALANCE_CONSTANTS.AGE_PENALTY_START) * BALANCE_CONSTANTS.AGE_PENALTY_RATE;
}

/**
 * Рассчитать штраф за недосып.
 * Применяется когда sleepDebt > 0.
 * @param {number} sleepDebt - накопленный долг сна в часах
 * @returns {{ energyPenalty: number, stressPenalty: number, efficiencyPenalty: number }}
 */
export function getSleepDebtPenalty(sleepDebt) {
  if (sleepDebt <= 0) return { energyPenalty: 0, stressPenalty: 0, efficiencyPenalty: 0 };
  return {
    energyPenalty: -(sleepDebt * 1.5),
    stressPenalty: sleepDebt * 0.8,
    efficiencyPenalty: -(sleepDebt * 2), // процент
  };
}

/**
 * Рассчитать итоговые изменения шкал за действие с учётом почасовых ставок.
 * @param {object} actionType - тип действия ('work', 'neutral', 'sleep')
 * @param {number} hours - количество часов
 * @param {object} flatStatChanges - плоские бонусы из карточки действия
 * @param {object} modifiers - модификаторы навыков
 * @param {number} currentAge - текущий возраст
 * @param {number} sleepDebt - долг сна
 * @returns {object} итоговые изменения шкал
 */
export function calculateStatChanges(actionType, hours, flatStatChanges = {}, modifiers = {}, currentAge = 25, sleepDebt = 0) {
  const rates = HOURLY_RATES[actionType] || HOURLY_RATES.neutral;
  const agingMultiplier = getAgingPenalty(currentAge);
  const sleepPenaltyRaw = getSleepDebtPenalty(sleepDebt);
  // Во время сна долг сна не должен «съедать» прирост энергии (иначе при 0 энергии и большом долге сон бесполезен)
  const sleepPenalty =
    actionType === 'sleep'
      ? { ...sleepPenaltyRaw, energyPenalty: 0 }
      : sleepPenaltyRaw;

  const result = {};

  // Все шкалы
  const stats = ['hunger', 'energy', 'stress', 'mood', 'health', 'physical'];

  for (const stat of stats) {
    let value = 0;

    // Почасовая ставка × часы
    if (rates[stat] !== undefined) {
      value += rates[stat] * hours;
    }

    // Flat-бонус из карточки
    if (flatStatChanges[stat] !== undefined) {
      value += flatStatChanges[stat];
    }

    // Модификаторы навыков (если есть)
    if (modifiers[stat] !== undefined) {
      value *= (1 + modifiers[stat]);
    }

    // Возрастной штраф (только для негативных значений)
    if (value < 0) {
      value *= agingMultiplier;
    }

    result[stat] = Math.round(value * 100) / 100; // Округление до 2 знаков
  }

  // Штраф за недосып (добавляется к результату)
  result.energy = (result.energy || 0) + sleepPenalty.energyPenalty;
  result.stress = (result.stress || 0) + sleepPenalty.stressPenalty;

  return result;
}
