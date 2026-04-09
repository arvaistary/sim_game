import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  WORK_COMPONENT,
  WALLET_COMPONENT,
  CAREER_COMPONENT,
  EDUCATION_COMPONENT,
  HOUSING_COMPONENT,
  FINANCE_COMPONENT,
  LIFETIME_STATS_COMPONENT,
  RELATIONSHIPS_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  EVENT_QUEUE_COMPONENT,
  ACTIVITY_LOG_COMPONENT,
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

    // Ensure canonical player entity exists before attaching components.
    if (!this.world.entities.has(playerId)) {
      this.world.entities.set(playerId, { id: playerId, components: new Set() });
    }

    // TimeComponent
    const resolvedTime = this._resolveTimeFromSave(save);
    this.world.addComponent(playerId, TIME_COMPONENT, {
      ...resolvedTime,
    });

    // StatsComponent
    this.world.addComponent(playerId, STATS_COMPONENT, { ...save.stats });

    // SkillsComponent
    this.world.addComponent(playerId, SKILLS_COMPONENT, { ...save.skills });

    // SkillModifiersComponent
    this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, { ...(save.skillModifiers || {}) });

    // WorkComponent
    this.world.addComponent(playerId, WORK_COMPONENT, {
      id: save.currentJob?.id,
      name: save.currentJob?.name,
      schedule: save.currentJob?.schedule ?? '5/2',
      employed: save.currentJob?.employed ?? Boolean(save.currentJob?.id),
      level: save.currentJob?.level,
      daysAtWork: save.currentJob?.daysAtWork,
      salaryPerHour: this._resolveSalaryPerHour(save.currentJob),
      salaryPerDay: save.currentJob?.salaryPerDay ?? this._resolveSalaryPerHour(save.currentJob) * 8,
      salaryPerWeek: save.currentJob?.salaryPerWeek ?? this._resolveSalaryPerHour(save.currentJob) * 40,
      requiredHoursPerWeek: save.currentJob?.requiredHoursPerWeek ?? 40,
      workedHoursCurrentWeek: save.currentJob?.workedHoursCurrentWeek ?? 0,
      totalWorkedHours: save.currentJob?.totalWorkedHours ?? 0,
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
      salaryPerHour: this._resolveSalaryPerHour(save.currentJob),
      salaryPerDay: save.currentJob?.salaryPerDay ?? this._resolveSalaryPerHour(save.currentJob) * 8,
      salaryPerWeek: save.currentJob?.salaryPerWeek ?? this._resolveSalaryPerHour(save.currentJob) * 40,
      schedule: save.currentJob?.schedule ?? '5/2',
      requiredHoursPerWeek: save.currentJob?.requiredHoursPerWeek ?? 40,
      workedHoursCurrentWeek: save.currentJob?.workedHoursCurrentWeek ?? 0,
      totalWorkedHours: save.currentJob?.totalWorkedHours ?? 0,
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

    // ActivityLogComponent
    this.world.addComponent(playerId, ACTIVITY_LOG_COMPONENT, {
      entries: save.activityLog?.entries || [],
      totalEntries: save.activityLog?.totalEntries || 0,
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
      save.time = {
        totalHours: time.totalHours,
        gameDays: time.gameDays,
        gameWeeks: time.gameWeeks,
        gameMonths: time.gameMonths,
        gameYears: time.gameYears,
        hourOfDay: time.hourOfDay,
        dayOfWeek: time.dayOfWeek,
        weekHoursSpent: time.weekHoursSpent,
        weekHoursRemaining: time.weekHoursRemaining,
        dayHoursSpent: time.dayHoursSpent,
        dayHoursRemaining: time.dayHoursRemaining,
        sleepHoursToday: time.sleepHoursToday,
        sleepDebt: time.sleepDebt,
      };
      save.eventState = {
        ...(save.eventState ?? {}),
        ...(time.eventState ?? {}),
      };
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

    const skillModifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT);
    if (skillModifiers) {
      save.skillModifiers = { ...skillModifiers };
    }

    // Work
    const work = this.world.getComponent(playerId, WORK_COMPONENT);
    if (work) {
      save.currentJob = {
        id: work.id,
        name: work.name,
        schedule: work.schedule ?? '5/2',
        employed: work.employed ?? Boolean(work.id),
        level: work.level,
        daysAtWork: work.daysAtWork,
        salaryPerHour: work.salaryPerHour,
        salaryPerDay: work.salaryPerDay,
        salaryPerWeek: work.salaryPerWeek,
        requiredHoursPerWeek: work.requiredHoursPerWeek,
        workedHoursCurrentWeek: work.workedHoursCurrentWeek,
        totalWorkedHours: work.totalWorkedHours,
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
        totalWorkHours: lifetimeStats.totalWorkHours,
        totalEvents: lifetimeStats.totalEvents,
        totalMicroEvents: lifetimeStats.totalMicroEvents,
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

    // Activity Log
    const activityLog = this.world.getComponent(playerId, ACTIVITY_LOG_COMPONENT);
    if (activityLog) {
      save.activityLog = {
        entries: activityLog.entries || [],
        totalEntries: activityLog.totalEntries || 0,
      };
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

  _resolveTimeFromSave(save) {
    const totalHours =
      Number(save.time?.totalHours) ||
      (Number(save.gameDays ?? 0) * 24);
    const gameDays = Math.floor(totalHours / 24);
    const weekIndex0 = Math.floor(totalHours / 168);
    const monthIndex0 = Math.floor(weekIndex0 / 4);
    const gameWeeks = weekIndex0 + 1;
    const gameMonths = monthIndex0 + 1;
    const gameYears = Number(((monthIndex0 + 1) / 12).toFixed(1));

    return {
      totalHours,
      gameDays,
      gameWeeks,
      gameMonths,
      gameYears,
      currentAge: save.currentAge ?? (save.startAge ?? 18) + Math.floor(gameDays / 360),
      startAge: save.startAge ?? 18,
      hourOfDay: save.time?.hourOfDay ?? (totalHours % 24),
      dayOfWeek: save.time?.dayOfWeek ?? ((Math.floor(totalHours / 24) % 7) + 1),
      weekHoursSpent: save.time?.weekHoursSpent ?? (totalHours % 168),
      weekHoursRemaining: save.time?.weekHoursRemaining ?? (168 - (totalHours % 168)),
      dayHoursSpent: save.time?.dayHoursSpent ?? (totalHours % 24),
      dayHoursRemaining: save.time?.dayHoursRemaining ?? (24 - (totalHours % 24)),
      sleepHoursToday: save.time?.sleepHoursToday ?? 0,
      sleepDebt: save.time?.sleepDebt ?? 0,
      eventState: save.eventState ?? save.time?.eventState ?? {},
    };
  }

  _resolveSalaryPerHour(job = {}) {
    if (typeof job?.salaryPerHour === 'number' && job.salaryPerHour > 0) return job.salaryPerHour;
    if (typeof job?.salaryPerDay === 'number' && job.salaryPerDay > 0) return Math.round(job.salaryPerDay / 8);
    if (typeof job?.salaryPerWeek === 'number' && job.salaryPerWeek > 0) return Math.round(job.salaryPerWeek / 40);
    return 0;
  }
}
