import { 
  PLAYER_ENTITY,
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  WORK_COMPONENT,
  WALLET_COMPONENT,
  CAREER_COMPONENT,
  EDUCATION_COMPONENT,
  HOUSING_COMPONENT,
  FINANCE_COMPONENT,
  LIFETIME_STATS_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  EVENT_QUEUE_COMPONENT
} from '../components/index.js';

/**
 * Адаптер для синхронизации ECS мира с game-state
 * Обеспечивает обратную совместимость во время миграции
 */
export class GameStateAdapter {
  constructor(world, saveData) {
    this.world = world;
    this.saveData = saveData;
  }

  /**
   * Инициализировать ECS компоненты из saveData
   */
  initializeFromSaveData() {
    const playerId = PLAYER_ENTITY;
    const save = this.saveData;

    // TimeComponent
    this.world.addComponent(playerId, TIME_COMPONENT, {
      gameDays: save.gameDays,
      gameWeeks: save.gameWeeks,
      gameMonths: save.gameMonths,
      gameYears: save.gameYears,
      currentAge: save.currentAge,
      startAge: save.startAge,
    });

    // StatsComponent
    this.world.addComponent(playerId, STATS_COMPONENT, { ...save.stats });

    // SkillsComponent
    this.world.addComponent(playerId, SKILLS_COMPONENT, { ...save.skills });

    // WorkComponent
    this.world.addComponent(playerId, WORK_COMPONENT, {
      id: save.currentJob?.id,
      name: save.currentJob?.name,
      level: save.currentJob?.level,
      daysAtWork: save.currentJob?.daysAtWork,
      salaryPerDay: save.currentJob?.salaryPerDay,
      salaryPerWeek: save.currentJob?.salaryPerWeek,
    });

    // WalletComponent
    this.world.addComponent(playerId, WALLET_COMPONENT, {
      money: save.money,
      totalEarnings: save.totalEarnings,
      totalSpent: save.totalSpent,
    });

    // CareerComponent
    this.world.addComponent(playerId, CAREER_COMPONENT, {
      id: save.currentJob?.id,
      name: save.currentJob?.name,
      level: save.currentJob?.level,
      daysAtWork: save.currentJob?.daysAtWork,
      salaryPerDay: save.currentJob?.salaryPerDay,
      salaryPerWeek: save.currentJob?.salaryPerWeek,
    });

    // EducationComponent
    this.world.addComponent(playerId, EDUCATION_COMPONENT, {
      school: save.education?.school,
      institute: save.education?.institute,
      educationLevel: save.education?.educationLevel,
      activeCourses: save.education?.activeCourses || [],
    });

    // HousingComponent
    this.world.addComponent(playerId, HOUSING_COMPONENT, {
      level: save.housing?.level,
      name: save.housing?.name,
      comfort: save.housing?.comfort,
      furniture: save.housing?.furniture || [],
      lastWeeklyBonus: save.housing?.lastWeeklyBonus,
    });

    // FinanceComponent
    this.world.addComponent(playerId, FINANCE_COMPONENT, {
      reserveFund: save.finance?.reserveFund,
      monthlyExpenses: save.finance?.monthlyExpenses,
      lastMonthlySettlement: save.finance?.lastMonthlySettlement,
    });

    // LifetimeStatsComponent
    this.world.addComponent(playerId, LIFETIME_STATS_COMPONENT, {
      totalWorkDays: save.lifetimeStats?.totalWorkDays,
      totalEvents: save.lifetimeStats?.totalEvents,
      maxMoney: save.lifetimeStats?.maxMoney,
    });

    // RelationshipsComponent
    this.world.addComponent(playerId, RELATIONSHIPS_COMPONENT, save.relationships || []);

    // EventHistoryComponent
    this.world.addComponent(playerId, EVENT_HISTORY_COMPONENT, {
      events: save.eventHistory || [],
      totalEvents: save.lifetimeStats?.totalEvents || 0,
    });

    // EventQueueComponent
    this.world.addComponent(playerId, EVENT_QUEUE_COMPONENT, {
      pendingEvents: save.pendingEvents || [],
    });

    // Investments (как массив в компоненте)
    this.world.addComponent(playerId, 'investment', save.investments || []);
  }

  /**
   * Синхронизировать изменения из ECS в saveData
   */
  syncToSaveData() {
    const playerId = PLAYER_ENTITY;
    const save = this.saveData;

    // Time
    const time = this.world.getComponent(playerId, TIME_COMPONENT);
    if (time) {
      save.gameDays = time.gameDays;
      save.gameWeeks = time.gameWeeks;
      save.gameMonths = time.gameMonths;
      save.gameYears = time.gameYears;
      save.currentAge = time.currentAge;
      save.startAge = time.startAge;
    }

    // Stats
    const stats = this.world.getComponent(playerId, STATS_COMPONENT);
    if (stats) {
      save.stats = { ...stats };
    }

    // Skills
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT);
    if (skills) {
      save.skills = { ...skills };
    }

    // Work
    const work = this.world.getComponent(playerId, WORK_COMPONENT);
    if (work) {
      save.currentJob = {
        id: work.id,
        name: work.name,
        level: work.level,
        daysAtWork: work.daysAtWork,
        salaryPerDay: work.salaryPerDay,
        salaryPerWeek: work.salaryPerWeek,
      };
    }

    // Wallet
    const wallet = this.world.getComponent(playerId, WALLET_COMPONENT);
    if (wallet) {
      save.money = wallet.money;
      save.totalEarnings = wallet.totalEarnings;
      save.totalSpent = wallet.totalSpent;
    }

    // Education
    const education = this.world.getComponent(playerId, EDUCATION_COMPONENT);
    if (education) {
      save.education = {
        school: education.school,
        institute: education.institute,
        educationLevel: education.educationLevel,
        activeCourses: education.activeCourses || [],
      };
    }

    // Housing
    const housing = this.world.getComponent(playerId, HOUSING_COMPONENT);
    if (housing) {
      save.housing = {
        level: housing.level,
        name: housing.name,
        comfort: housing.comfort,
        furniture: housing.furniture || [],
        lastWeeklyBonus: housing.lastWeeklyBonus,
      };
    }

    // Finance
    const finance = this.world.getComponent(playerId, FINANCE_COMPONENT);
    if (finance) {
      save.finance = {
        reserveFund: finance.reserveFund,
        monthlyExpenses: finance.monthlyExpenses,
        lastMonthlySettlement: finance.lastMonthlySettlement,
      };
    }

    // Lifetime Stats
    const lifetimeStats = this.world.getComponent(playerId, LIFETIME_STATS_COMPONENT);
    if (lifetimeStats) {
      save.lifetimeStats = {
        totalWorkDays: lifetimeStats.totalWorkDays,
        totalEvents: lifetimeStats.totalEvents,
        maxMoney: lifetimeStats.maxMoney,
      };
    }

    // Relationships
    const relationships = this.world.getComponent(playerId, RELATIONSHIPS_COMPONENT);
    if (relationships) {
      save.relationships = relationships;
    }

    // Event History
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT);
    if (eventHistory) {
      save.eventHistory = eventHistory.events || [];
      if (!save.lifetimeStats) save.lifetimeStats = {};
      save.lifetimeStats.totalEvents = eventHistory.totalEvents;
    }

    // Event Queue
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT);
    if (eventQueue) {
      save.pendingEvents = eventQueue.pendingEvents || [];
    }

    // Investments
    const investments = this.world.getComponent(playerId, 'investment');
    if (investments) {
      save.investments = investments;
    }
  }

  /**
   * Получить saveData (для совместимости со старым кодом)
   */
  getSaveData() {
    this.syncToSaveData();
    return this.saveData;
  }

  /**
   * Обновить saveData (для совместимости со старым кодом)
   */
  setSaveData(newSaveData) {
    this.saveData = newSaveData;
    this.initializeFromSaveData();
  }
}
