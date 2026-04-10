import { DEFAULT_SAVE } from '../../balance/default-save'
import { PLAYER_ENTITY } from '../components/index'
import type { ECSWorld } from '../world'
import type { SaveData } from '../../balance/default-save'

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

type MigrationFn = (saveData: Record<string, unknown>) => Record<string, unknown>

/**
 * Система сохранения и загрузки игры
 * Обеспечивает версионирование и миграцию сохранений
 */
export class PersistenceSystem {
  private world!: ECSWorld

  readonly currentVersion = '1.1.0'
  readonly currentSaveVersion = 2
  readonly saveKey = 'game-life-save'

  private migrations: Record<string, MigrationFn>

  constructor() {
    this.migrations = {
      '0.1.0': this._migrateFrom_0_1_0.bind(this),
      '0.2.0': this._migrateFrom_0_2_0.bind(this),
    }
  }

  init(world: ECSWorld): void {
    this.world = world
  }

  /**
   * Загрузить сохранение из localStorage
   */
  loadSave(): SaveData {
    const stored = window.localStorage.getItem(this.saveKey)

    if (!stored) {
      return this._createDefaultSave()
    }

    try {
      const parsed = JSON.parse(stored) as Record<string, unknown>

      // Валидация
      const validation = this._validateSave(parsed)
      if (!validation.isValid) {
        console.warn('Валидация сохранения не прошла:', validation.errors)
      }

      // Миграция
      const migrated = this._applyMigrations(parsed)

      // Объединение с дефолтными данными
      return this._mergeAndMigrate(migrated) as unknown as SaveData
    } catch (error) {
      console.warn('Не удалось прочитать сохранение, использую демо-данные.', error)
      return this._createDefaultSave()
    }
  }

  /**
   * Сохранить игру в localStorage
   */
  saveGame(saveData: Record<string, unknown>): void {
    // Применяем версии
    if (!saveData.version) {
      saveData.version = this.currentVersion
    }
    if (typeof saveData.saveVersion !== 'number') {
      saveData.saveVersion = this.currentSaveVersion
    }

    // Синхронизируем из ECS если передан world
    if (this.world) {
      this._syncFromWorld(saveData)
    }

    saveData.saveTime = Date.now()
    window.localStorage.setItem(this.saveKey, JSON.stringify(saveData))
  }

  /**
   * Создать сохранение по умолчанию
   */
  _createDefaultSave(): SaveData {
    return structuredClone(DEFAULT_SAVE)
  }

  /**
   * Объединить и мигрировать загруженное сохранение
   */
  _mergeAndMigrate(parsed: Record<string, unknown>): Record<string, unknown> {
    const base = structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>
    const baseCurrentJob = (base.currentJob ?? {}) as Record<string, unknown>
    const parsedHasJob = parsed.currentJob && ((parsed.currentJob as Record<string, unknown>).id)
    const parsedCurrentJob = parsedHasJob ? (parsed.currentJob as Record<string, unknown>) : {}

    return {
      ...base,
      ...parsed,
      version: parsed.version || '0.1.0',
      saveVersion: typeof parsed.saveVersion === 'number' ? parsed.saveVersion : this.currentSaveVersion,
      stats: {
        ...(base.stats as Record<string, unknown>),
        ...((parsed.stats ?? {}) as Record<string, unknown>),
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
        ...(base.housing as Record<string, unknown>),
        ...((parsed.housing ?? {}) as Record<string, unknown>),
        furniture: ((parsed.housing as Record<string, unknown>)?.furniture ?? (base.housing as Record<string, unknown>).furniture),
      },
      skills: {
        ...(base.skills as Record<string, unknown>),
        ...((parsed.skills ?? {}) as Record<string, unknown>),
      },
      skillModifiers: {
        ...((base.skillModifiers ?? {}) as Record<string, unknown>),
        ...((parsed.skillModifiers ?? {}) as Record<string, unknown>),
      },
      education: {
        ...(base.education as Record<string, unknown>),
        ...((parsed.education ?? {}) as Record<string, unknown>),
        activeCourses: ((parsed.education as Record<string, unknown>)?.activeCourses ?? (base.education as Record<string, unknown>).activeCourses),
      },
      finance: {
        ...(base.finance as Record<string, unknown>),
        ...((parsed.finance ?? {}) as Record<string, unknown>),
        monthlyExpenses: {
          ...((base.finance as Record<string, unknown>).monthlyExpenses as Record<string, unknown>),
          ...(((parsed.finance as Record<string, unknown>)?.monthlyExpenses ?? {}) as Record<string, unknown>),
        },
      },
      relationships: parsed.relationships ?? base.relationships,
      investments: parsed.investments ?? base.investments,
      eventHistory: parsed.eventHistory ?? base.eventHistory,
      pendingEvents: parsed.pendingEvents ?? base.pendingEvents,
      time: {
        ...((base.time ?? {}) as Record<string, unknown>),
        ...((parsed.time ?? {}) as Record<string, unknown>),
      },
      eventState: {
        ...((base.eventState ?? {}) as Record<string, unknown>),
        ...((parsed.eventState ?? {}) as Record<string, unknown>),
      },
      lifetimeStats: {
        ...(base.lifetimeStats as Record<string, unknown>),
        ...((parsed.lifetimeStats ?? {}) as Record<string, unknown>),
      },
    }
  }

  /**
   * Синхронизировать данные из ECS мира в saveData
   */
  _syncFromWorld(saveData: Record<string, unknown>): void {
    const playerId = PLAYER_ENTITY

    // Time
    const time = this.world.getComponent(playerId, 'time') as Record<string, unknown> | null
    if (time) {
      saveData.gameDays = time.gameDays
      saveData.gameWeeks = time.gameWeeks
      saveData.gameMonths = time.gameMonths
      saveData.gameYears = time.gameYears
      saveData.currentAge = time.currentAge
      saveData.startAge = time.startAge
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
      }
      saveData.eventState = {
        ...(saveData.eventState as Record<string, unknown> ?? {}),
        ...(time.eventState as Record<string, unknown> ?? {}),
      }
    }

    // Stats
    const stats = this.world.getComponent(playerId, 'stats') as Record<string, unknown> | null
    if (stats) {
      saveData.stats = { ...stats }
    }

    // Skills
    const skills = this.world.getComponent(playerId, 'skills') as Record<string, unknown> | null
    if (skills) {
      saveData.skills = { ...skills }
    }

    const skillModifiers = this.world.getComponent(playerId, 'skillModifiers') as Record<string, unknown> | null
    if (skillModifiers) {
      saveData.skillModifiers = { ...skillModifiers }
    }

    // Work
    const work = this.world.getComponent(playerId, 'work') as Record<string, unknown> | null
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
      }
    }

    // Wallet
    const wallet = this.world.getComponent(playerId, 'wallet') as Record<string, unknown> | null
    if (wallet) {
      saveData.money = wallet.money
      saveData.totalEarnings = wallet.totalEarnings
      saveData.totalSpent = wallet.totalSpent
    }

    // Education
    const education = this.world.getComponent(playerId, 'education') as Record<string, unknown> | null
    if (education) {
      saveData.education = {
        school: education.school,
        institute: education.institute,
        educationLevel: education.educationLevel,
        activeCourses: education.activeCourses || [],
      }
    }

    // Housing
    const housing = this.world.getComponent(playerId, 'housing') as Record<string, unknown> | null
    if (housing) {
      saveData.housing = {
        level: housing.level,
        name: housing.name,
        comfort: housing.comfort,
        furniture: housing.furniture || [],
        lastWeeklyBonus: housing.lastWeeklyBonus,
      }
    }

    // Finance
    const finance = this.world.getComponent(playerId, 'finance') as Record<string, unknown> | null
    if (finance) {
      saveData.finance = {
        reserveFund: finance.reserveFund,
        monthlyExpenses: finance.monthlyExpenses,
        lastMonthlySettlement: finance.lastMonthlySettlement,
      }
    }

    // Lifetime Stats
    const lifetimeStats = this.world.getComponent(playerId, 'lifetimeStats') as Record<string, unknown> | null
    if (lifetimeStats) {
      saveData.lifetimeStats = {
        totalWorkDays: lifetimeStats.totalWorkDays,
        totalWorkHours: lifetimeStats.totalWorkHours,
        totalEvents: lifetimeStats.totalEvents,
        totalMicroEvents: lifetimeStats.totalMicroEvents,
        maxMoney: lifetimeStats.maxMoney,
      }
    }

    // Relationships
    const relationships = this.world.getComponent(playerId, 'relationships')
    if (relationships) {
      saveData.relationships = relationships
    }

    // Event History
    const eventHistory = this.world.getComponent(playerId, 'eventHistory') as Record<string, unknown> | null
    if (eventHistory) {
      saveData.eventHistory = (eventHistory.events || []) as unknown[]
      if (!saveData.lifetimeStats) saveData.lifetimeStats = {}
      ;(saveData.lifetimeStats as Record<string, unknown>).totalEvents = eventHistory.totalEvents
      ;(saveData.lifetimeStats as Record<string, unknown>).totalMicroEvents = ((eventHistory.events || []) as unknown[]).filter((item: unknown) => (item as Record<string, unknown>).type === 'micro').length
    }

    // Event Queue
    const eventQueue = this.world.getComponent(playerId, 'eventQueue') as Record<string, unknown> | null
    if (eventQueue) {
      saveData.pendingEvents = eventQueue.pendingEvents || []
    }

    // Investments
    const investments = this.world.getComponent(playerId, 'investment')
    if (investments) {
      saveData.investments = investments
    }
  }

  /**
   * Миграция с версии 0.1.0
   */
  _migrateFrom_0_1_0(saveData: Record<string, unknown>): Record<string, unknown> {
    if (!saveData.version) {
      saveData.version = '0.2.0'
    }

    if (typeof saveData.saveVersion !== 'number') {
      saveData.saveVersion = 1
    }

    const finance = (saveData.finance ?? {}) as Record<string, unknown>
    if (typeof finance.reserveFund !== 'number') {
      finance.reserveFund = 0
    }

    if (!finance.monthlyExpenses) {
      finance.monthlyExpenses = {
        housing: 16000,
        food: 9000,
        transport: 4500,
        leisure: 6500,
        education: 2500,
      }
    }
    saveData.finance = finance

    if (!saveData.investments) {
      saveData.investments = []
    }

    if (!saveData.eventHistory) {
      saveData.eventHistory = []
    }

    if (!saveData.pendingEvents) {
      saveData.pendingEvents = []
    }

    if (!saveData.lifetimeStats) {
      saveData.lifetimeStats = {
        totalWorkDays: 0,
        totalEvents: 0,
        maxMoney: saveData.money || 0,
      }
    }

    return saveData
  }

  /**
   * Миграция с версии 0.2.0
   */
  _migrateFrom_0_2_0(saveData: Record<string, unknown>): Record<string, unknown> {
    const education = (saveData.education ?? {}) as Record<string, unknown>
    if (!Array.isArray(education.activeCourses)) {
      education.activeCourses = []
    }
    saveData.education = education

    const finance = (saveData.finance ?? {}) as Record<string, unknown>
    if (!finance.lastMonthlySettlement) {
      finance.lastMonthlySettlement = null
    }
    saveData.finance = finance

    const housing = (saveData.housing ?? {}) as Record<string, unknown>
    if (!housing.comfort) {
      const housingLevels = [
        { level: 1, name: 'Общежитие', comfort: 30 },
        { level: 2, name: 'Студия', comfort: 50 },
        { level: 3, name: '1-комнатная', comfort: 70 },
        { level: 4, name: '2-комнатная', comfort: 90 },
      ]
      const housingMatch = housingLevels.find(h => h.level === housing.level) || housingLevels[0]
      housing.comfort = housingMatch.comfort
    }
    saveData.housing = housing

    saveData.version = '0.2.0'

    return saveData
  }

  /**
   * Проверить и применить миграции
   */
  applyMigrations(saveData: Record<string, unknown>): Record<string, unknown> {
    const version = (saveData.version || '0.1.0') as string

    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (version < migrationVersion) {
        migrateFn(saveData)
        saveData.version = migrationVersion
      }
    }

    return saveData
  }

  /**
   * Валидация сохранения
   */
  _validateSave(saveData: Record<string, unknown>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!saveData.version) {
      warnings.push('Отсутствует версия сохранения')
    }

    if (typeof saveData.money !== 'number' || (saveData.money as number) < 0) {
      errors.push('Некорректное значение денег')
    }

    if (typeof saveData.gameDays !== 'number' || (saveData.gameDays as number) < 0) {
      errors.push('Некорректное значение дней')
    }

    const time = saveData.time as Record<string, unknown> | undefined
    const totalHours = Number(time?.totalHours)
    if (!Number.isNaN(totalHours) && totalHours < 0) {
      errors.push('Некорректное значение totalHours')
    }

    if (!saveData.stats || typeof saveData.stats !== 'object') {
      warnings.push('Отсутствуют статы')
    }

    if (!saveData.housing || typeof saveData.housing !== 'object') {
      warnings.push('Отсутствуют данные о жилье')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Применить миграции к сохранению
   */
  _applyMigrations(saveData: Record<string, unknown>): Record<string, unknown> {
    const version = (saveData.version || '0.1.0') as string

    for (const [migrationVersion, migrateFn] of Object.entries(this.migrations)) {
      if (version < migrationVersion) {
        try {
          console.log(`Applying migration from ${version} to ${migrationVersion}`)
          saveData = migrateFn(saveData)
          saveData.version = migrationVersion
        } catch (error) {
          console.error(`Migration failed: ${(error as Error).message}`, error)
        }
      }
    }

    if (saveData.version !== this.currentVersion) {
      saveData.version = this.currentVersion
    }

    // Hour-model compatibility defaults
    if (!saveData.time || typeof saveData.time !== 'object') {
      const totalHours = Math.max(0, Number(saveData.gameDays ?? 0) * 24)
      saveData.time = { totalHours }
    }
    const time = saveData.time as Record<string, unknown>
    if (typeof time.totalHours !== 'number') {
      time.totalHours = Math.max(0, Number(saveData.gameDays ?? 0) * 24)
    }
    if (!saveData.eventState || typeof saveData.eventState !== 'object') {
      saveData.eventState = {}
    }
    const currentJob = (saveData.currentJob ?? {}) as Record<string, unknown>
    if (!saveData.currentJob) saveData.currentJob = {}
    if (typeof currentJob.salaryPerHour !== 'number') {
      currentJob.salaryPerHour = this._resolveSalaryPerHour(currentJob)
    }
    if (typeof currentJob.salaryPerDay !== 'number') {
      currentJob.salaryPerDay = (currentJob.salaryPerHour as number) * 8
    }
    if (typeof currentJob.salaryPerWeek !== 'number') {
      currentJob.salaryPerWeek = (currentJob.salaryPerHour as number) * 40
    }

    return saveData
  }

  _resolveSalaryPerHour(job: Record<string, unknown> = {}): number {
    if (typeof job?.salaryPerHour === 'number' && (job.salaryPerHour as number) > 0) return job.salaryPerHour as number
    if (typeof job?.salaryPerDay === 'number' && (job.salaryPerDay as number) > 0) return Math.round((job.salaryPerDay as number) / 8)
    if (typeof job?.salaryPerWeek === 'number' && (job.salaryPerWeek as number) > 0) return Math.round((job.salaryPerWeek as number) / 40)
    return 0
  }

  /**
   * Удалить сохранение
   */
  clearSave(): void {
    window.localStorage.removeItem(this.saveKey)
  }

  /**
   * Проверить наличие сохранения
   */
  hasSave(): boolean {
    return Boolean(window.localStorage.getItem(this.saveKey))
  }
}

