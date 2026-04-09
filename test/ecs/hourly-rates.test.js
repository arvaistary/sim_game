import {
  HOURLY_RATES,
  BALANCE_CONSTANTS,
  getAgingPenalty,
  getSleepDebtPenalty,
  calculateStatChanges,
} from '../../src/balance/hourly-rates.js';

describe('HOURLY_RATES', () => {
  test('содержит ставки для work, neutral, sleep', () => {
    expect(HOURLY_RATES.work).toBeDefined();
    expect(HOURLY_RATES.neutral).toBeDefined();
    expect(HOURLY_RATES.sleep).toBeDefined();
  });

  test('work: голод уменьшается, энергия уменьшается, стресс растёт', () => {
    expect(HOURLY_RATES.work.hunger).toBeLessThan(0);
    expect(HOURLY_RATES.work.energy).toBeLessThan(0);
    expect(HOURLY_RATES.work.stress).toBeGreaterThan(0);
  });

  test('sleep: энергия восстанавливается, стресс падает', () => {
    expect(HOURLY_RATES.sleep.energy).toBeGreaterThan(0);
    expect(HOURLY_RATES.sleep.stress).toBeLessThan(0);
  });

  test('8ч сна компенсирует расход энергии рабочего дня', () => {
    const workEnergy = HOURLY_RATES.work.energy * 8; // -2.7 * 8 = -21.6
    const sleepEnergy = HOURLY_RATES.sleep.energy * 8; // 6.8 * 8 = 54.4
    expect(sleepEnergy + workEnergy).toBeGreaterThan(0);
  });
});

describe('getAgingPenalty', () => {
  test('до 40 лет штраф = 1.0', () => {
    expect(getAgingPenalty(25)).toBe(1.0);
    expect(getAgingPenalty(39)).toBe(1.0);
  });

  test('после 40 лет штраф увеличивается', () => {
    expect(getAgingPenalty(41)).toBeGreaterThan(1.0);
    expect(getAgingPenalty(50)).toBeGreaterThan(getAgingPenalty(45));
  });

  test('45 лет → множитель ~1.0375', () => {
    expect(getAgingPenalty(45)).toBeCloseTo(1.0375, 3);
  });
});

describe('getSleepDebtPenalty', () => {
  test('нет долга → нет штрафа', () => {
    const penalty = getSleepDebtPenalty(0);
    expect(penalty.energyPenalty).toBe(0);
    expect(penalty.stressPenalty).toBe(0);
    expect(penalty.efficiencyPenalty).toBe(0);
  });

  test('положительный долг → штрафы', () => {
    const penalty = getSleepDebtPenalty(5);
    expect(penalty.energyPenalty).toBeLessThan(0);
    expect(penalty.stressPenalty).toBeGreaterThan(0);
    expect(penalty.efficiencyPenalty).toBeLessThan(0);
  });
});

describe('calculateStatChanges', () => {
  test('рассчитывает изменения для 8ч работы', () => {
    const changes = calculateStatChanges('work', 8);
    expect(changes.hunger).toBeLessThan(0);
    expect(changes.energy).toBeLessThan(0);
    expect(changes.stress).toBeGreaterThan(0);
  });

  test('рассчитывает изменения для 8ч сна', () => {
    const changes = calculateStatChanges('sleep', 8);
    expect(changes.energy).toBeGreaterThan(0);
    expect(changes.stress).toBeLessThan(0);
  });

  test('добавляет flat-бонусы', () => {
    const changes = calculateStatChanges('neutral', 2, { mood: 10 });
    expect(changes.mood).toBeGreaterThan(0);
  });

  test('применяет возрастной штраф к негативным значениям', () => {
    const changes25 = calculateStatChanges('work', 8, {}, {}, 25, 0);
    const changes50 = calculateStatChanges('work', 8, {}, {}, 50, 0);
    // У 50-летнего негативные эффекты сильнее
    expect(changes25.energy).toBeGreaterThan(changes50.energy);
  });

  test('неизвестный тип использует neutral ставки', () => {
    const changes = calculateStatChanges('unknown_type', 2);
    expect(changes).toBeDefined();
  });
});
