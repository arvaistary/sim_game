import { DEFAULT_SAVE } from '../../balance/default-save.js';
import { PLAYER_ENTITY } from '../components/index.js';

/**
 * Система сохранения и загрузки игры
 * Обеспечивает версионирование и миграцию сохранений
 */
export class PersistenceSystem {
  constructor() {
    this.currentVersion = '1.1.0';
    this.currentSaveVersion = 2;
    this.saveKey = 'game-life-save';
    this.migrations = {
      '0.1.0': this._migrateFrom_0_1_0.bind(this),
      '0.2.0': this._migrateFrom_0_2_0.bind(this),
      // Добавьте будущие миграции здесь
    };
  }

  init(world) {
    this.world = world;
  }

  /**
   * Загрузить сохранение из localStorage
   */
  loadSave() {
    const stored = window.localStorage.getItem(this.saveKey);

    if (!stored) {
      return this._createDefaultSave();
    }

    try {
      const parsed = JSON.parse(stored);

      // Валидация
      const validation = this._validateSave(parsed);
      if (!validation.isValid) {
        console.warn('Валидация сохранения не прошла:', validation.errors);
      }

      // Миграция
      const migrated = this._applyMigrations(parsed);

      // Объединение с дефолтными данными
      return this._mergeAndMigrate(migrated);
    } catch (error) {
      console.warn('Не удалось прочитать сохранение, использую демо-данные.', error);
      return this._createDefaultSave();
    }
  }

  /**
   * Сохранить игру в localStorage
   */
  saveGame(saveData) {
    // Применяем версии
    if (!saveData.version) {
      saveData.version = this.currentVersion;
    }
    if (typeof saveData.saveVersion !== 'number') {
      saveData.saveVersion = this.currentSaveVersion;
    }

    // Синхронизируем из ECS если передан world
    if (this.world) {
      this._syncFromWorld(saveData);
    }

    saveData.saveTime = Date.now();
    window.localStorage.setItem(this.saveKey, JSON.stringify(saveData));
  }

  /**
   * Создать сохранение по умолчанию
   */
  _createDefaultSave() {
    return structuredClone(DEFAULT_SAVE);
  }

  /**
   * Объединить и мигрировать загруженное сохранение
   */
  _mergeAndMigrate(parsed) {
    const base = structuredClone(DEFAULT_SAVE);
    const baseCurrentJob = base.currentJob ?? {};
    const parsedHasJob = parsed.currentJob && parsed.currentJob.id;
    const parsedCurrentJob = parsedHasJob ? parsed.currentJob : {};
    
    return {
      ...base,
      ...parsed,
      version: parsed.version || '0.1.0', // Для старых сохранений
      saveVersion: typeof parsed.saveVersion === 'number' ? parsed.saveVersion : this.currentSaveVersion,
      stats: {
        ...base.stats,
        ...(parsed.stats ?? {}),
      },
      currentJob: parsedHasJob
        ? {
            ...baseCurrentJob,
            ...parsedCurrentJob,
            salaryPerHour: parsedCurrentJob.salaryPerHour ?? this._resolveSalaryPerHour(parsedCurrentJob),
            salaryPerDay: parsedCurrentJob.salaryPerDay ?? this._resolveSalaryPerHour(parsedCurrentJob) * 8,
            salaryPerWeek: parsedCurrentJob.salaryPerWeek ?? this._resolveSalaryPerHour(parsedCurrentJob) * 40,
          }
        : null,
      housing: {
        ...base.housing,
        ...(parsed.housing ?? {}),
        furniture: parsed.housing?.furniture ?? base.housing.furniture,
      },
      skills: {
        ...base.skills,
        ...(parsed.skills ?? {}),
      },
      skillModifiers: {
        ...(base.skillModifiers ?? {}),
        ...(parsed.skillModifiers ?? {}),
      },
      education: {
        ...base.education,
        ...(parsed.education ?? {}),
        activeCourses: parsed.education?.activeCourses ?? base.education.activeCourses,
      },
      finance: {
        ...base.finance,
        ...(parsed.finance ?? {}),
        monthlyExpenses: {
          ...base.finance.monthlyExpenses,
          ...(parsed.finance?.monthlyExpenses ?? {}),
        },
      },
      relationships: parsed.relationships ?? base.relationships,
      investments: parsed.investments ?? base.investments,
      eventHistory: parsed.eventHistory ?? base.eventHistory,
      pendingEvents: parsed.pendingEvents ?? base.pendingEvents,
      time: {
        ...(base.time ?? {}),
        ...(parsed.time ?? {}),
      },
      eventState: {
        ...(base.eventState ?? {}),
        ...(parsed.eventState ?? {}),
      },
      lifetimeStats: {
        ...base.lifetimeStats,
        ...(parsed.lifetimeStats ?? {}),
      },
    };
  }

  /**
   * Синхронизировать данные из ECS мира в saveData
   */
  _syncFromWorld(saveData) {
    const playerId = PLAYER_ENTITY;

    // Time
    const time = this.world.getComponent(playerId, 'time');
    if (time) {
      saveData.gameDays = time.gameDays;
      saveData.gameWeeks = time.gameWeeks;
      saveData.gameMonths = time.gameMonths;
      saveData.gameYears = time.gameYears;
      saveData.currentAge = time.currentAge;
      saveData.startAge = time.startAge;
      saveData.time = {
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
      saveData.eventState = {
        ...(saveData.eventState ?? {}),
        ...(time.eventState ?? {}),
      };
    }

    // Stats
    const stats = this.world.getComponent(playerId, 'stats');
    if (stats) {
      saveData.stats = { ...stats };
    }

    // Skills
    const skills = this.world.getComponent(playerId, 'skills');
    if (skills) {
      saveData.skills = { ...skills };
    }

    const skillModifiers = this.world.getComponent(playerId, 'skillModifiers');
    if (skillModifiers) {
      saveData.skillModifiers = { ...skillModifiers };
    }

    // Work
    const work = this.world.getComponent(playerId, 'work');
    if (work) {
      saveData.currentJob = {
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
    const wallet = this.world.getComponent(playerId, 'wallet');
    if (wallet) {
      saveData.money = wallet.money;
      saveData.totalEarnings = wallet.totalEarnings;
      saveData.totalSpent = wallet.totalSpent;
    }

    // Education
    const education = this.world.getComponent(playerId, 'education');
    if (education) {
      saveData.education = {
        school: education.school,
        institute: education.institute,
        educationLevel: education.educationLevel,
        activeCourses: education.activeCourses || [],
      };
    }

    // Housing
    const housing = this.world.getComponent(playerId, 'housing');
    if (housing) {
      saveData.housing = {
        level: housing.level,
        name: housing.name,
        comfort: housing.comfort,
        furniture: housing.furniture || [],
        lastWeeklyBonus: housing.lastWeeklyBonus,
      };
    }

    // Finance
    const finance = this.world.getComponent(playerId, 'finance');
    if (finance) {
      saveData.finance = {
        reserveFund: finance.reserveFund,
        monthlyExpenses: finance.monthlyExpenses,
        lastMonthlySettlement: finance.lastMonthlySettlement,
      };
    }

    // Lifetime Stats
    const lifetimeStats = this.world.getComponent(playerId, 'lifetime_stats');
    if (lifetimeStats) {
      saveData.lifetimeStats = {
        totalWorkDays: lifetimeStats.totalWorkDays,
        totalWorkHours: lifetimeStats.totalWorkHours,
        totalEvents: lifetimeStats.totalEvents,
        totalMicroEvents: lifetimeStats.totalMicroEvents,
        maxMoney: lifetimeStats.maxMoney,
      };
    }

    // Relationships
    const relationships = this.world.getComponent(playerId, 'relationships');
    if (relationships) {
      saveData.relationships = relationships;
    }

    // Event History
    const eventHistory = this.world.getComponent(playerId, 'event_history');
    if (eventHistory) {
      saveData.eventHistory = eventHistory.events || [];
      if (!saveData.lifetimeStats) saveData.lifetimeStats = {};
      saveData.lifetimeStats.totalEvents = eventHistory.totalEvents;
      saveData.lifetimeStats.totalMicroEvents = (eventHistory.events || []).filter((item) => item.type === 'micro').length;
    }

    // Event Queue
    const eventQueue = this.world.getComponent(playerId, 'event_queue');
    if (eventQueue) {
      saveData.pendingEvents = eventQueue.pendingEvents || [];
    }

    // Investments
    const investments = this.world.getComponent(playerId, 'investment');
    if (investments) {
      saveData.investments = investments;
    }
  }

  /**
   * Миграция с версии 0.1.0
   * Добавляет версию, резервный фонд и другие новые поля
   */
  _migrateFrom_0_1_0(saveData) {
    // Добавляем версию
    if (!saveData.version) {
      saveData.version = '0.2.0';
    }

    // Добавляем saveVersion если отсутствует
    if (typeof saveData.saveVersion !== 'number') {
      saveData.saveVersion = 1;
    }

    // Добавляем резервный фонд если отсутствует
    if (!saveData.finance) {
      saveData.finance = {};
    }
    if (typeof saveData.finance.reserveFund !== 'number') {
      saveData.finance.reserveFund = 0;
    }

    // Добавляем ежемесячные расходы если отсутствуют
    if (!saveData.finance.monthlyExpenses) {
      saveData.finance.monthlyExpenses = {
        housing: 16000,
        food: 9000,
        transport: 4500,
        leisure: 6500,
        education: 2500,
      };
    }

    // Добавляем инвестиции если отсутствуют
    if (!saveData.investments) {
      saveData.investments = [];
    }

    // Добавляем eventHistory если отсутствует
    if (!saveData.eventHistory) {
      saveData.eventHistory = [];
    }

    // Добавляем pendingEvents если отсутствует
    if (!saveData.pendingEvents) {
      saveData.pendingEvents = [];
    }

    // Добавляем lifetimeStats если отсутствует
    if (!saveData.lifetimeStats) {
      saveData.lifetimeStats = {
        totalWorkDays: 0,
        totalEvents: 0,
        maxMoney: saveData.money || 0,
      };
    }

    return saveData;
  }

  /**
   * Миграция с версии 0.2.0
   * Миграция для ECS архитектуры
   */
  _migrateFrom_0_2_0(saveData) {
    // Миграция для совместимости с ECS
    // В этой версии структура данных уже соответствует ECS

    // Проверяем наличие education.activeCourses
    if (!saveData.education) {
      saveData.education = {};
    }
    if (!Array.isArray(saveData.education.activeCourses)) {
      saveData.education.activeCourses = [];
    }

    // Проверяем наличие finance.lastMonthlySettlement
    if (!saveData.finance.lastMonthlySettlement) {
      saveData.finance.lastMonthlySettlement = null;
    }

    // Проверяем наличие housing.comfort
    if (!saveData.housing.comfort) {
      const housingLevels = [
        { level: 1, name: 'Общежитие', comfort: 30 },
        { level: 2, name: 'Студия', comfort: 50 },
        { level: 3, name: '1-комнатная', comfort: 70 },
        { level: 4, name: '2-комнатная', comfort: 90 },
      ];
      const housing = housingLevels.find(h => h.level === saveData.housing.level) || housingLevels[0];
      saveData.housing.comfort = housing.comfort;
    }

    // Обновляем версию
    saveData.version = '0.2.0';

    return saveData;
  }

  /**
   * Проверить и применить миграции
   */
  applyMigrations(saveData) {
    const version = saveData.version || '0.1.0';

    // Применяем миграции по порядку версий
    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (version < migrationVersion) {
        migrateFn(saveData);
        saveData.version = migrationVersion;
      }
    }

    return saveData;
  }

  /**
   * Валидация сохранения
   */
  _validateSave(saveData) {
    const errors = [];
    const warnings = [];

    // Проверка обязательных полей
    if (!saveData.version) {
      warnings.push('Отсутствует версия сохранения');
    }

    if (typeof saveData.money !== 'number' || saveData.money < 0) {
      errors.push('Некорректное значение денег');
    }

    if (typeof saveData.gameDays !== 'number' || saveData.gameDays < 0) {
      errors.push('Некорректное значение дней');
    }

    const totalHours = Number(saveData.time?.totalHours);
    if (!Number.isNaN(totalHours) && totalHours < 0) {
      errors.push('Некорректное значение totalHours');
    }

    if (!saveData.stats || typeof saveData.stats !== 'object') {
      warnings.push('Отсутствуют статы');
    }

    if (!saveData.housing || typeof saveData.housing !== 'object') {
      warnings.push('Отсутствуют данные о жилье');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Применить миграции к сохранению
   */
  _applyMigrations(saveData) {
    const version = saveData.version || '0.1.0';

    // Применяем миграции по порядку версий
    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (version < migrationVersion) {
        try {
          console.log(`Applying migration from ${version} to ${migrationVersion}`);
          saveData = migrateFn(saveData);
          saveData.version = migrationVersion;
        } catch (error) {
          console.error(`Migration failed: ${error.message}`, error);
        }
      }
    }

    // Если версия устарела, обновляем до текущей
    if (saveData.version !== this.currentVersion) {
      saveData.version = this.currentVersion;
    }

    // Hour-model compatibility defaults
    if (!saveData.time || typeof saveData.time !== 'object') {
      const totalHours = Math.max(0, Number(saveData.gameDays ?? 0) * 24);
      saveData.time = { totalHours };
    }
    if (typeof saveData.time.totalHours !== 'number') {
      saveData.time.totalHours = Math.max(0, Number(saveData.gameDays ?? 0) * 24);
    }
    if (!saveData.eventState || typeof saveData.eventState !== 'object') {
      saveData.eventState = {};
    }
    if (!saveData.currentJob) saveData.currentJob = {};
    if (typeof saveData.currentJob.salaryPerHour !== 'number') {
      saveData.currentJob.salaryPerHour = this._resolveSalaryPerHour(saveData.currentJob);
    }
    if (typeof saveData.currentJob.salaryPerDay !== 'number') {
      saveData.currentJob.salaryPerDay = saveData.currentJob.salaryPerHour * 8;
    }
    if (typeof saveData.currentJob.salaryPerWeek !== 'number') {
      saveData.currentJob.salaryPerWeek = saveData.currentJob.salaryPerHour * 40;
    }

    return saveData;
  }

  _resolveSalaryPerHour(job = {}) {
    if (typeof job?.salaryPerHour === 'number' && job.salaryPerHour > 0) return job.salaryPerHour;
    if (typeof job?.salaryPerDay === 'number' && job.salaryPerDay > 0) return Math.round(job.salaryPerDay / 8);
    if (typeof job?.salaryPerWeek === 'number' && job.salaryPerWeek > 0) return Math.round(job.salaryPerWeek / 40);
    return 0;
  }

  /**
   * Удалить сохранение
   */
  clearSave() {
    window.localStorage.removeItem(this.saveKey);
  }

  /**
   * Проверить наличие сохранения
   */
  hasSave() {
    return Boolean(window.localStorage.getItem(this.saveKey));
  }
}
