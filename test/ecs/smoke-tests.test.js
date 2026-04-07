import { ECSWorld } from '../../src/ecs/world.js';
import { SceneAdapter } from '../../src/ecs/adapters/SceneAdapter.js';
import { defaultSaveData } from '../../src/ecs/data/default-save.js';
import { StatsSystem } from '../../src/ecs/systems/StatsSystem.js';
import { WorkPeriodSystem } from '../../src/ecs/systems/WorkPeriodSystem.js';
import { RecoverySystem } from '../../src/ecs/systems/RecoverySystem.js';
import { EventQueueSystem } from '../../src/ecs/systems/EventQueueSystem.js';
import { MonthlySettlementSystem } from '../../src/ecs/systems/MonthlySettlementSystem.js';

describe('Smoke Tests - Базовый сценарий игры', () => {
  let world;
  let sceneAdapter;
  let playerEntityId;

  beforeEach(() => {
    // Создаем мир ECS
    world = new ECSWorld();
    
    // Создаем адаптер сцены
    sceneAdapter = new SceneAdapter(null, defaultSaveData);
    sceneAdapter.initialize();
    
    // Получаем ID игрока
    playerEntityId = sceneAdapter.getPlayerEntityId();
  });

  describe('Сценарий: Start Work -> Event -> Recovery -> Save/Load', () => {
    it('должен успешно пройти полный цикл базового сценария', () => {
      // 1. Проверяем начальное состояние
      const initialStats = world.getComponent(playerEntityId, 'stats');
      expect(initialStats).toBeDefined();
      expect(initialStats.energy).toBeGreaterThan(0);
      
      const initialFinance = world.getComponent(playerEntityId, 'finance');
      expect(initialFinance).toBeDefined();
      expect(initialFinance.money).toBe(defaultSaveData.money);
      
      // 2. Проводим рабочий период
      const workPeriodSystem = sceneAdapter.getSystem('workPeriod');
      const workSummary = workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      expect(workSummary).toBeDefined();
      expect(typeof workSummary).toBe('string');
      
      // Проверяем изменения
      const afterWorkStats = world.getComponent(playerEntityId, 'stats');
      expect(afterWorkStats.energy).toBeLessThan(initialStats.energy);
      expect(afterWorkStats.stress).toBeGreaterThan(initialStats.stress);
      
      const afterWorkFinance = world.getComponent(playerEntityId, 'finance');
      expect(afterWorkFinance.money).toBeGreaterThan(initialFinance.money);
      
      // 3. Обрабатываем событие (симулируем)
      const eventQueueSystem = sceneAdapter.getSystem('eventQueue');
      const events = eventQueueSystem.getPendingEvents(playerEntityId);
      
      // Добавляем тестовое событие
      eventQueueSystem.addEvent(playerEntityId, {
        id: 'test_event',
        title: 'Тестовое событие',
        description: 'Это тестовое событие для smoke test',
        choices: [
          {
            id: 'choice_1',
            text: 'Выбор 1',
            effects: {
              stats: { energy: -5, stress: 2 }
            }
          },
          {
            id: 'choice_2',
            text: 'Выбор 2',
            effects: {
              stats: { energy: 5, stress: -2 }
            }
          }
        ]
      });
      
      const updatedEvents = eventQueueSystem.getPendingEvents(playerEntityId);
      expect(updatedEvents.length).toBeGreaterThan(0);
      
      // Применяем выбор события
      eventQueueSystem.applyEventChoice(playerEntityId, updatedEvents[0].id, 'choice_1');
      
      // 4. Восстановление
      const recoverySystem = sceneAdapter.getSystem('recovery');
      const recoveryResult = recoverySystem.recover(playerEntityId, 'energy', 'energy_drink');
      
      expect(recoveryResult).toBeDefined();
      
      // Проверяем восстановление энергии
      const afterRecoveryStats = world.getComponent(playerEntityId, 'stats');
      expect(afterRecoveryStats.energy).toBeGreaterThan(afterWorkStats.energy);
      
      // 5. Синхронизация и сохранение
      sceneAdapter.syncToSaveData();
      const saveData = sceneAdapter.getSaveData();
      
      expect(saveData).toBeDefined();
      expect(saveData.stats).toBeDefined();
      expect(saveData.money).toBeDefined();
      
      // 6. Проверка целостности данных
      expect(saveData.stats.energy).toBe(afterRecoveryStats.energy);
      expect(saveData.stats.stress).toBe(afterRecoveryStats.stress);
      expect(saveData.money).toBe(afterWorkFinance.money);
      
      // Успешное завершение smoke test
      expect(true).toBe(true);
    });

    it('должен корректно обрабатывать несколько рабочих периодов подряд', () => {
      const workPeriodSystem = sceneAdapter.getSystem('workPeriod');
      const statsSystem = sceneAdapter.getSystem('stats');
      
      // Запоминаем начальное состояние
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      const initialEnergy = world.getComponent(playerEntityId, 'stats').energy;
      
      // Проводим 3 рабочих периода
      for (let i = 0; i < 3; i++) {
        workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      }
      
      // Проверяем накопительный эффект
      const finalFinance = world.getComponent(playerEntityId, 'finance');
      const finalStats = world.getComponent(playerEntityId, 'stats');
      
      // Деньги должны увеличиться
      expect(finalFinance.money).toBeGreaterThan(initialMoney);
      
      // Энергия должна уменьшиться (но не ниже 0)
      expect(finalStats.energy).toBeLessThan(initialEnergy);
      expect(finalStats.energy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Интеграционные тесты сценариев', () => {
    it('должен корректно обрабатывать ежемесячный расчет', () => {
      const monthlySettlementSystem = sceneAdapter.getSystem('monthlySettlement');
      
      // Проводим рабочий период для получения дохода
      const workPeriodSystem = sceneAdapter.getSystem('workPeriod');
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 22); // рабочий месяц
      
      const beforeSettlementMoney = world.getComponent(playerEntityId, 'finance').money;
      
      // Проводим ежемесячный расчет
      const settlementResult = monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      expect(settlementResult).toBeDefined();
      expect(settlementResult.summary).toBeDefined();
      
      const afterSettlementMoney = world.getComponent(playerEntityId, 'finance').money;
      
      // Деньги должны измениться
      expect(afterSettlementMoney).not.toBe(beforeSettlementMoney);
    });

    it('должен корректно обрабатывать восстановление разных типов', () => {
      const recoverySystem = sceneAdapter.getSystem('recovery');
      
      // Создаем стресс и восстанавливаемся
      world.updateComponent(playerEntityId, 'stats', { stress: 80 });
      
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      
      // Восстановление через развлечения
      const result1 = recoverySystem.recover(playerEntityId, 'stress', 'entertainment');
      const after1 = world.getComponent(playerEntityId, 'stats').stress;
      
      expect(after1).toBeLessThan(initialStress);
      
      // Восстановление через магазин
      const result2 = recoverySystem.recover(playerEntityId, 'mood', 'shopping');
      const after2 = world.getComponent(playerEntityId, 'stats').mood;
      
      expect(after2).toBeGreaterThan(0);
    });

    it('должен корректно обрабатывать очередь событий', () => {
      const eventQueueSystem = sceneAdapter.getSystem('eventQueue');
      
      // Добавляем несколько событий
      const event1 = {
        id: 'event_1',
        title: 'Событие 1',
        description: 'Описание события 1',
        choices: [
          { id: 'choice_1', text: 'Выбор 1', effects: { stats: { energy: -5 } } }
        ]
      };
      
      const event2 = {
        id: 'event_2',
        title: 'Событие 2',
        description: 'Описание события 2',
        choices: [
          { id: 'choice_2', text: 'Выбор 2', effects: { stats: { energy: 5 } } }
        ]
      };
      
      eventQueueSystem.addEvent(playerEntityId, event1);
      eventQueueSystem.addEvent(playerEntityId, event2);
      
      const events = eventQueueSystem.getPendingEvents(playerEntityId);
      expect(events).toHaveLength(2);
      
      // Обрабатываем первое событие
      eventQueueSystem.applyEventChoice(playerEntityId, event1.id, 'choice_1');
      
      const remainingEvents = eventQueueSystem.getPendingEvents(playerEntityId);
      expect(remainingEvents).toHaveLength(1);
      expect(remainingEvents[0].id).toBe(event2.id);
    });
  });

  describe('Проверка паритета с legacy системой', () => {
    it('должен выдавать те же результаты расчета зарплаты, что и legacy', () => {
      // В legacy: зарплата = salaryPerDay * workDays
      const legacyCalc = (salaryPerDay, workDays) => salaryPerDay * workDays;
      
      const workPeriodSystem = sceneAdapter.getSystem('workPeriod');
      const career = world.getComponent(playerEntityId, 'career');
      const salaryPerDay = career.currentJob.salaryPerDay;
      const workDays = 5;
      
      const legacySalary = legacyCalc(salaryPerDay, workDays);
      
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, workDays);
      const finalMoney = world.getComponent(playerEntityId, 'finance').money;
      
      const ecsSalary = finalMoney - initialMoney;
      
      expect(ecsSalary).toBe(legacySalary);
    });

    it('должен корректно ограничивать статы диапазоном 0-100', () => {
      const statsSystem = sceneAdapter.getSystem('stats');
      
      // Пытаемся превысить лимиты
      statsSystem.applyStatChanges(playerEntityId, {
        energy: 200,
        stress: -100,
        health: 150,
        mood: -50
      });
      
      const stats = world.getComponent(playerEntityId, 'stats');
      
      expect(stats.energy).toBe(100);
      expect(stats.stress).toBe(0);
      expect(stats.health).toBe(100);
      expect(stats.mood).toBe(0);
    });

    it('должен корректно сохранять и загружать данные', () => {
      // Изменяем состояние
      const workPeriodSystem = sceneAdapter.getSystem('workPeriod');
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      // Сохраняем
      sceneAdapter.syncToSaveData();
      const savedData = sceneAdapter.getSaveData();
      
      // Создаем новый мир и адаптер
      const newWorld = new ECSWorld();
      const newSceneAdapter = new SceneAdapter(null, savedData);
      newSceneAdapter.initialize();
      
      // Загружаем
      const newPlayerId = newSceneAdapter.getPlayerEntityId();
      
      // Проверяем соответствие данных
      const originalStats = world.getComponent(playerEntityId, 'stats');
      const loadedStats = newWorld.getComponent(newPlayerId, 'stats');
      
      expect(loadedStats.energy).toBe(originalStats.energy);
      expect(loadedStats.stress).toBe(originalStats.stress);
      expect(loadedStats.health).toBe(originalStats.health);
      expect(loadedStats.mood).toBe(originalStats.mood);
    });
  });
});
