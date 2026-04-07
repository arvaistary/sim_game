import { ECSWorld } from '../../src/ecs/world.js';
import { StatsSystem } from '../../src/ecs/systems/StatsSystem.js';

describe('StatsSystem', () => {
  let world;
  let statsSystem;
  let playerEntityId;

  beforeEach(() => {
    world = new ECSWorld();
    statsSystem = new StatsSystem();
    statsSystem.init(world);
    
    playerEntityId = world.createEntity();
    world.addComponent(playerEntityId, 'stats', {
      energy: 50,
      stress: 30,
      health: 75,
      mood: 60
    });
  });

  describe('applyStatChanges', () => {
    it('должен корректно изменять статы в допустимых пределах', () => {
      statsSystem.applyStatChanges(playerEntityId, {
        energy: 10,
        stress: -5,
        health: 15,
        mood: 20
      });

      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBe(60);
      expect(stats.stress).toBe(25);
      expect(stats.health).toBe(90);
      expect(stats.mood).toBe(80);
    });

    it('должен ограничивать статы диапазоном 0-100', () => {
      statsSystem.applyStatChanges(playerEntityId, {
        energy: 200,  // превысит 100
        stress: -100  // упадет ниже 0
      });

      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBe(100);
      expect(stats.stress).toBe(0);
    });

    it('должен корректно обрабатывать отрицательные значения', () => {
      statsSystem.applyStatChanges(playerEntityId, {
        energy: -20,
        stress: 15,
        health: -30,
        mood: -10
      });

      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.energy).toBe(30);
      expect(stats.stress).toBe(45);
      expect(stats.health).toBe(45);
      expect(stats.mood).toBe(50);
    });
  });

  describe('clampStatValue', () => {
    it('должен ограничивать значение верхним пределом', () => {
      expect(statsSystem.clampStatValue(150)).toBe(100);
    });

    it('должен ограничивать значение нижним пределом', () => {
      expect(statsSystem.clampStatValue(-50)).toBe(0);
    });

    it('должен возвращать неизменное значение в пределах диапазона', () => {
      expect(statsSystem.clampStatValue(50)).toBe(50);
      expect(statsSystem.clampStatValue(0)).toBe(0);
      expect(statsSystem.clampStatValue(100)).toBe(100);
    });
  });

  describe('getStat', () => {
    it('должен возвращать значение стата', () => {
      expect(statsSystem.getStat(playerEntityId, 'energy')).toBe(50);
      expect(statsSystem.getStat(playerEntityId, 'stress')).toBe(30);
    });

    it('должен возвращать 0 для несуществующего стата', () => {
      expect(statsSystem.getStat(playerEntityId, 'nonexistent')).toBe(0);
    });

    it('должен возвращать 0 для несуществующей сущности', () => {
      expect(statsSystem.getStat('nonexistent', 'energy')).toBe(0);
    });
  });

  describe('setStat', () => {
    it('должен устанавливать значение стата с ограничением', () => {
      statsSystem.setStat(playerEntityId, 'energy', 150);
      expect(statsSystem.getStat(playerEntityId, 'energy')).toBe(100);

      statsSystem.setStat(playerEntityId, 'energy', -20);
      expect(statsSystem.getStat(playerEntityId, 'energy')).toBe(0);
    });

    it('должен устанавливать корректные значения', () => {
      statsSystem.setStat(playerEntityId, 'energy', 75);
      expect(statsSystem.getStat(playerEntityId, 'energy')).toBe(75);
    });
  });
});
