import { ECSWorld } from '../world.js';
import { GameStateAdapter } from './GameStateAdapter.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { StatsSystem } from '../systems/StatsSystem.js';
import { SkillsSystem } from '../systems/SkillsSystem.js';
import { WorkPeriodSystem } from '../systems/WorkPeriodSystem.js';
import { RecoverySystem } from '../systems/RecoverySystem.js';
import { PersistenceSystem } from '../systems/PersistenceSystem.js';
import { CareerProgressSystem } from '../systems/CareerProgressSystem.js';
import { FinanceActionSystem } from '../systems/FinanceActionSystem.js';
import { InvestmentSystem } from '../systems/InvestmentSystem.js';
import { MonthlySettlementSystem } from '../systems/MonthlySettlementSystem.js';
import { EventQueueSystem } from '../systems/EventQueueSystem.js';
import { EventChoiceSystem } from '../systems/EventChoiceSystem.js';
import { EventHistorySystem } from '../systems/EventHistorySystem.js';
import { EducationSystem } from '../systems/EducationSystem.js';
import { MigrationSystem } from '../systems/MigrationSystem.js';
import { PLAYER_ENTITY } from '../components/index.js';

/**
 * SceneAdapter - базовый класс для адаптации Phaser сцен к ECS
 * Создаёт ECS мир, инициализирует системы и связывает с Phaser
 */
export class SceneAdapter {
  constructor(scene, saveData) {
    this.scene = scene;
    this.world = new ECSWorld();
    this.gameStateAdapter = new GameStateAdapter(this.world, saveData);
    this.systems = {};
  }

  /**
   * Инициализировать ECS мир
   */
  initialize() {
    // Инициализируем компоненты из saveData
    this.gameStateAdapter.initializeFromSaveData();

    // Добавляем системы
    this.addSystems();

    // Хуки для событий времени
    this._setupTimeHooks();
  }

  /**
   * Добавить системы в мир
   */
  addSystems() {
    // Time System
    const timeSystem = new TimeSystem();
    this.world.addSystem(timeSystem);
    this.systems.time = timeSystem;

    // Stats System
    const statsSystem = new StatsSystem();
    this.world.addSystem(statsSystem);
    this.systems.stats = statsSystem;

    // Skills System
    const skillsSystem = new SkillsSystem();
    this.world.addSystem(skillsSystem);
    this.systems.skills = skillsSystem;

    // Work Period System
    const workPeriodSystem = new WorkPeriodSystem();
    this.world.addSystem(workPeriodSystem);
    this.systems.workPeriod = workPeriodSystem;

    // Recovery System
    const recoverySystem = new RecoverySystem();
    this.world.addSystem(recoverySystem);
    this.systems.recovery = recoverySystem;

    // Persistence System
    const persistenceSystem = new PersistenceSystem();
    this.world.addSystem(persistenceSystem);
    this.systems.persistence = persistenceSystem;

    // Career Progress System
    const careerProgressSystem = new CareerProgressSystem();
    this.world.addSystem(careerProgressSystem);
    this.systems.careerProgress = careerProgressSystem;

    // Finance Action System
    const financeActionSystem = new FinanceActionSystem();
    this.world.addSystem(financeActionSystem);
    this.systems.financeAction = financeActionSystem;

    // Investment System
    const investmentSystem = new InvestmentSystem();
    this.world.addSystem(investmentSystem);
    this.systems.investment = investmentSystem;

    // Monthly Settlement System
    const monthlySettlementSystem = new MonthlySettlementSystem();
    this.world.addSystem(monthlySettlementSystem);
    this.systems.monthlySettlement = monthlySettlementSystem;

    // Event Queue System
    const eventQueueSystem = new EventQueueSystem();
    this.world.addSystem(eventQueueSystem);
    this.systems.eventQueue = eventQueueSystem;

    // Event Choice System
    const eventChoiceSystem = new EventChoiceSystem();
    this.world.addSystem(eventChoiceSystem);
    this.systems.eventChoice = eventChoiceSystem;

    // Event History System
    const eventHistorySystem = new EventHistorySystem();
    this.world.addSystem(eventHistorySystem);
    this.systems.eventHistory = eventHistorySystem;

    // Education System
    const educationSystem = new EducationSystem();
    this.world.addSystem(educationSystem);
    this.systems.education = educationSystem;

    // Migration System
    const migrationSystem = new MigrationSystem();
    this.world.addSystem(migrationSystem);
    this.systems.migration = migrationSystem;
  }

  /**
   * Настроить хуки для событий времени
   */
  _setupTimeHooks() {
    // Недельные события (будут реализованы позже)
    this.systems.time.onWeeklyEvent((weekNumber) => {
      // Автоматически обрабатываются через MonthlySettlementSystem
      // при достижении недельного интервала
    });

    // Месячные события
    this.systems.time.onMonthlyEvent((monthNumber) => {
      this.systems.monthlySettlement.applyMonthlySettlement(monthNumber);
    });

    // События по возрасту (будут реализованы позже)
    this.systems.time.onAgeEvent((previousAge, currentAge) => {
      console.log(`Age event: ${previousAge} -> ${currentAge}`);
    });
  }

  /**
   * Обновить ECS мир
   */
  update(deltaTime) {
    this.world.update(deltaTime);
  }

  /**
   * Синхронизировать изменения в saveData
   */
  syncToSaveData() {
    return this.gameStateAdapter.syncToSaveData();
  }

  /**
   * Получить текущий saveData
   */
  getSaveData() {
    return this.gameStateAdapter.getSaveData();
  }

  updateFromSaveData(saveData) {
    this.gameStateAdapter.setSaveData(saveData);
  }

  getPlayerEntityId() {
    return PLAYER_ENTITY;
  }

  /**
   * Получить систему по имени
   */
  getSystem(systemName) {
    return this.systems[systemName];
  }

  /**
   * Получить ECS мир
   */
  getWorld() {
    return this.world;
  }

  /**
   * Уничтожить адаптер
   */
  destroy() {
    this.world.clear();
    this.systems = {};
  }
}
