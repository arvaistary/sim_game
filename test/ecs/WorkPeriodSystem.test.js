import { ECSWorld } from '../../src/ecs/world.js';
import { WorkPeriodSystem } from '../../src/ecs/systems/WorkPeriodSystem.js';
import { StatsSystem } from '../../src/ecs/systems/StatsSystem.js';

describe('WorkPeriodSystem', () => {
  let world;
  let workPeriodSystem;
  let statsSystem;
  let playerEntityId;

  beforeEach(() => {
    world = new ECSWorld();
    statsSystem = new StatsSystem();
    statsSystem.init(world);
    workPeriodSystem = new WorkPeriodSystem();
    workPeriodSystem.init(world);
    
    playerEntityId = world.createEntity();
    world.addComponent(playerEntityId, 'stats', {
      energy: 80,
      stress: 20,
      health: 90,
      mood: 70
    });
    world.addComponent(playerEntityId, 'career', {
      currentJob: {
        id: 'office_worker',
        name: 'Офисный работник',
        salaryPerDay: 1500,
        stressPerDay: 5,
        energyPerDay: 8
      }
    });
    world.addComponent(playerEntityId, 'finance', {
      money: 10000
    });
  });

  describe('applyWorkPeriodResult', () => {
    it('должен корректно начислять зарплату за 5 рабочих дней', () => {
      const summary = workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      const finance = world.getComponent(playerEntityId, 'finance');
      expect(finance.money).toBe(17500); // 10000 + 1500 * 5
      expect(summary).toContain('7500');
    });

    it('должен уменьшать энергию и увеличивать стресс', () => {
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBeLessThan(80); // должно уменьшиться
      expect(stats.stress).toBeGreaterThan(20); // должно увеличиться
    });

    it('должен корректно рассчитывать потерю энергии', () => {
      const initialEnergy = world.getComponent(playerEntityId, 'stats').energy;
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      const expectedEnergyLoss = 5 * 8; // 5 дней * 8 энергии
      expect(stats.energy).toBe(initialEnergy - expectedEnergyLoss);
    });

    it('должен корректно увеличивать стресс', () => {
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      const expectedStressIncrease = 5 * 5; // 5 дней * 5 стресса
      expect(stats.stress).toBe(initialStress + expectedStressIncrease);
    });

    it('должен ограничивать значения статов 0-100', () => {
      // Устанавливаем граничные значения
      world.updateComponent(playerEntityId, 'stats', {
        energy: 10,
        stress: 95
      });
      
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBe(0); // не должно быть отрицательным
      expect(stats.stress).toBe(100); // не должно превышать 100
    });

    it('должен работать для разных длительностей', () => {
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      
      // 3 дня
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 3);
      let finance = world.getComponent(playerEntityId, 'finance');
      expect(finance.money).toBe(initialMoney + 1500 * 3);
      
      // Сброс и 2 дня
      world.updateComponent(playerEntityId, 'finance', { money: initialMoney });
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 2);
      finance = world.getComponent(playerEntityId, 'finance');
      expect(finance.money).toBe(initialMoney + 1500 * 2);
    });

    it('должен возвращать информативное описание', () => {
      const summary = workPeriodSystem.applyWorkPeriodResult(playerEntityId, 5);
      
      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    });
  });

  describe('взаимодействие со StatsSystem', () => {
    it('должен использовать StatsSystem для изменения статов', () => {
      const initialEnergy = world.getComponent(playerEntityId, 'stats').energy;
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      
      workPeriodSystem.applyWorkPeriodResult(playerEntityId, 3);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      const energyLoss = initialEnergy - stats.energy;
      const stressGain = stats.stress - initialStress;
      
      expect(energyLoss).toBe(3 * 8); // 3 дня * 8 энергии
      expect(stressGain).toBe(3 * 5); // 3 дня * 5 стресса
    });
  });
});
