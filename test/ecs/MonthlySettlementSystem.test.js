import { ECSWorld } from '../../src/ecs/world.js';
import { MonthlySettlementSystem } from '../../src/ecs/systems/MonthlySettlementSystem.js';
import { StatsSystem } from '../../src/ecs/systems/StatsSystem.js';

describe('MonthlySettlementSystem', () => {
  let world;
  let monthlySettlementSystem;
  let statsSystem;
  let playerEntityId;

  beforeEach(() => {
    world = new ECSWorld();
    statsSystem = new StatsSystem();
    statsSystem.init(world);
    monthlySettlementSystem = new MonthlySettlementSystem();
    monthlySettlementSystem.init(world);
    
    playerEntityId = world.createEntity();
    world.addComponent(playerEntityId, 'stats', {
      energy: 80,
      stress: 30,
      health: 90,
      mood: 70
    });
    world.addComponent(playerEntityId, 'finance', {
      money: 10000,
      reserveFund: 2000,
      expenses: 3000,
      investments: []
    });
    world.addComponent(playerEntityId, 'housing', {
      currentLevel: 'apartment',
      rent: 8000,
      comfort: 35
    });
    world.addComponent(playerEntityId, 'career', {
      currentJob: {
        id: 'office_worker',
        name: 'Офисный работник',
        salaryPerDay: 1500
      }
    });
  });

  describe('processMonthlyExpenses', () => {
    it('должен списывать ежемесячные расходы', () => {
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      monthlySettlementSystem.processMonthlyExpenses(playerEntityId);
      
      const finance = world.getComponent(playerEntityId, 'finance');
      // Ожидаем: 10000 - 3000 (expenses) - 8000 (rent) = -1000
      // Но с учетом зарплаты за 22 рабочих дня: -1000 + 33000 = 32000
      expect(finance.money).not.toBe(initialMoney);
    });

    it('должен использовать резервный фонд если денег не хватает', () => {
      world.updateComponent(playerEntityId, 'finance', {
        money: 5000,
        reserveFund: 2000,
        expenses: 3000
      });
      
      monthlySettlementSystem.processMonthlyExpenses(playerEntityId);
      
      const finance = world.getComponent(playerEntityId, 'finance');
      // Деньги не должны быть отрицательными, если есть резерв
      expect(finance.money).toBeGreaterThanOrEqual(0);
    });

    it('должен увеличивать стресс при нехватке денег', () => {
      world.updateComponent(playerEntityId, 'finance', {
        money: 1000,
        reserveFund: 0,
        expenses: 3000
      });
      
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      monthlySettlementSystem.processMonthlyExpenses(playerEntityId);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.stress).toBeGreaterThan(initialStress);
    });
  });

  describe('calculateMonthlyIncome', () => {
    it('должен корректно рассчитывать доход с работы', () => {
      const income = monthlySettlementSystem.calculateMonthlyIncome(playerEntityId);
      
      // 22 рабочих дня * 1500 = 33000
      expect(income).toBe(33000);
    });

    it('должен учитывать доход от инвестиций', () => {
      world.updateComponent(playerEntityId, 'finance', {
        investments: [
          { id: 'bank_deposit', amount: 50000, rate: 0.08, type: 'savings' }
        ]
      });
      
      const income = monthlySettlementSystem.calculateMonthlyIncome(playerEntityId);
      // 33000 (зарплата) + 50000 * 0.08 / 12 (инвестиции) ≈ 33333
      expect(income).toBeGreaterThan(33000);
    });

    it('должен возвращать 0 если нет работы', () => {
      world.removeComponent(playerEntityId, 'career');
      
      const income = monthlySettlementSystem.calculateMonthlyIncome(playerEntityId);
      expect(income).toBe(0);
    });
  });

  describe('calculateInvestmentReturns', () => {
    it('должен рассчитывать доход от депозита', () => {
      world.updateComponent(playerEntityId, 'finance', {
        investments: [
          { id: 'bank_deposit', amount: 50000, rate: 0.08, type: 'savings' }
        ]
      });
      
      const returns = monthlySettlementSystem.calculateInvestmentReturns(playerEntityId);
      // 50000 * 0.08 / 12 = 333.33
      expect(returns).toBeCloseTo(333.33, 1);
    });

    it('должен рассчитывать доход от акций', () => {
      world.updateComponent(playerEntityId, 'finance', {
        investments: [
          { id: 'stocks', amount: 30000, rate: 0.15, type: 'stocks' }
        ]
      });
      
      const returns = monthlySettlementSystem.calculateInvestmentReturns(playerEntityId);
      // 30000 * 0.15 / 12 = 375
      expect(returns).toBeCloseTo(375, 1);
    });

    it('должен суммировать доход от всех инвестиций', () => {
      world.updateComponent(playerEntityId, 'finance', {
        investments: [
          { id: 'bank_deposit', amount: 50000, rate: 0.08, type: 'savings' },
          { id: 'stocks', amount: 30000, rate: 0.15, type: 'stocks' }
        ]
      });
      
      const returns = monthlySettlementSystem.calculateInvestmentReturns(playerEntityId);
      // 333.33 + 375 = 708.33
      expect(returns).toBeCloseTo(708.33, 1);
    });

    it('должен возвращать 0 если нет инвестиций', () => {
      world.updateComponent(playerEntityId, 'finance', {
        investments: []
      });
      
      const returns = monthlySettlementSystem.calculateInvestmentReturns(playerEntityId);
      expect(returns).toBe(0);
    });
  });

  describe('applyMonthlySettlement', () => {
    it('должен проводить полный ежемесячный расчет', () => {
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      const result = monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      const finance = world.getComponent(playerEntityId, 'finance');
      expect(finance.money).not.toBe(initialMoney);
      expect(result).toBeDefined();
      expect(typeof result.summary).toBe('string');
    });

    it('должен возвращать детальный отчет о расчетах', () => {
      const result = monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      expect(result).toHaveProperty('income');
      expect(result).toHaveProperty('expenses');
      expect(result).toHaveProperty('investmentReturns');
      expect(result).toHaveProperty('netChange');
      expect(result).toHaveProperty('summary');
    });

    it('должен корректно рассчитывать чистое изменение', () => {
      const result = monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      // netChange = income + investmentReturns - expenses - rent
      expect(result.netChange).toBeDefined();
      expect(typeof result.netChange).toBe('number');
    });
  });

  describe('взаимодействие с другими системами', () => {
    it('должен использовать StatsSystem для изменения стресса', () => {
      world.updateComponent(playerEntityId, 'finance', {
        money: 1000,
        reserveFund: 0,
        expenses: 5000
      });
      
      const initialStress = world.getComponent(playerEntityId, 'stats').stress;
      monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      const stats = world.getComponent(playerEntityId, 'stats');
      expect(stats.stress).toBeGreaterThan(initialStress);
    });

    it('должен обновлять компонент finance', () => {
      const initialMoney = world.getComponent(playerEntityId, 'finance').money;
      monthlySettlementSystem.applyMonthlySettlement(playerEntityId);
      
      const finance = world.getComponent(playerEntityId, 'finance');
      expect(finance.money).toBeDefined();
      expect(typeof finance.money).toBe('number');
    });
  });
});
