import { DEFAULT_SAVE } from '../../../balance/constants/default-save'
import type { CharacterTag } from '../../../balance/types'
import { PLAYER_ENTITY, TAGS_COMPONENT } from '../../components/index'
import type { GameWorld } from '../../world'
import type { SaveData } from '../../../balance/constants/default-save'
import type { ValidationResult, ComponentMapper } from './index.types'
import { MigrationSystem } from '../MigrationSystem/index'
import { normalizeJobShape, resolveSalaryPerHour } from './save-job-normalize'

function mergeById<T extends Record<string, unknown>>(baseArr: T[], parsed: unknown[], idKey: string): T[] {
  const map = new Map<string, T>()
  for (const item of baseArr) {
    const id = String(item[idKey])
    map.set(id, { ...item })
  }
  for (const raw of parsed) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as T
    const id = String(item[idKey])
    if (!id || id === 'undefined') continue
    const prev = map.get(id) ?? ({} as T)
    map.set(id, { ...prev, ...item })
  }
  return [...map.values()]
}

function mergePrimitiveArrays<T>(base: T[], parsed: unknown): T[] {
  if (!Array.isArray(parsed)) return [...base]
  if (parsed.length === 0) return [...base]
  const seen = new Set<string>()
  const out: T[] = []
  for (const x of base) {
    const k = JSON.stringify(x)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(x)
    }
  }
  for (const x of parsed as T[]) {
    const k = JSON.stringify(x)
    if (!seen.has(k)) {
      seen.add(k)
      out.push(x)
    }
  }
  return out
}

/**
 * Система сохранения и загрузки игры.
 * Миграции и версия — только через MigrationSystem.
 */
export class PersistenceSystem {
  private world!: GameWorld
  private readonly migrationSystem: MigrationSystem
  private readonly componentRegistry = new Map<string, ComponentMapper>()
  private mappersRegistered = false

  readonly saveKey = 'game-life-save'

  constructor(migrationSystem?: MigrationSystem) {
    this.migrationSystem = migrationSystem ?? new MigrationSystem()
  }

  getMigrationSystem(): MigrationSystem {
    return this.migrationSystem
  }

  registerComponentMapper(component: string, mapper: ComponentMapper): void {
    this.componentRegistry.set(component, mapper)
  }

  init(world: GameWorld): void {
    this.world = world
    this.migrationSystem.init(world)
    this._ensureDefaultMappersRegistered()
  }

  private _ensureDefaultMappersRegistered(): void {
    if (this.mappersRegistered) return
    this.mappersRegistered = true

    this.registerComponentMapper('time', {
      component: 'time',
      syncFromWorld: (world, playerId, saveData) => {
        const time = world.getComponent(playerId, 'time') as Record<string, unknown> | null
        if (!time) return
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
          ...((saveData.eventState as Record<string, unknown>) ?? {}),
          ...((time.eventState as Record<string, unknown>) ?? {}),
        }
      },
    })

    this.registerComponentMapper('stats', {
      component: 'stats',
      syncFromWorld: (world, playerId, saveData) => {
        const stats = world.getComponent(playerId, 'stats') as Record<string, unknown> | null
        if (stats) saveData.stats = { ...stats }
      },
    })

    this.registerComponentMapper('skills', {
      component: 'skills',
      syncFromWorld: (world, playerId, saveData) => {
        const skills = world.getComponent(playerId, 'skills') as Record<string, unknown> | null
        if (skills) saveData.skills = { ...skills }
      },
    })

    this.registerComponentMapper('skillModifiers', {
      component: 'skillModifiers',
      syncFromWorld: (world, playerId, saveData) => {
        const skillModifiers = world.getComponent(playerId, 'skillModifiers') as Record<string, unknown> | null
        if (skillModifiers) saveData.skillModifiers = { ...skillModifiers }
      },
    })

    this.registerComponentMapper('work', {
      component: 'work',
      syncFromWorld: (world, playerId, saveData) => {
        const work = world.getComponent(playerId, 'work') as Record<string, unknown> | null
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
      },
    })

    this.registerComponentMapper('wallet', {
      component: 'wallet',
      syncFromWorld: (world, playerId, saveData) => {
        const wallet = world.getComponent(playerId, 'wallet') as Record<string, unknown> | null
        if (wallet) {
          saveData.money = wallet.money
          saveData.totalEarnings = wallet.totalEarnings
          saveData.totalSpent = wallet.totalSpent
        }
      },
    })

    this.registerComponentMapper('education', {
      component: 'education',
      syncFromWorld: (world, playerId, saveData) => {
        const education = world.getComponent(playerId, 'education') as Record<string, unknown> | null
        if (education) {
          saveData.education = {
            school: education.school,
            institute: education.institute,
            educationLevel: education.educationLevel,
            activeCourses: education.activeCourses || [],
            completedPrograms: education.completedPrograms || [],
          }
        }
      },
    })

    this.registerComponentMapper('housing', {
      component: 'housing',
      syncFromWorld: (world, playerId, saveData) => {
        const housing = world.getComponent(playerId, 'housing') as Record<string, unknown> | null
        if (housing) {
          saveData.housing = {
            level: housing.level,
            name: housing.name,
            comfort: housing.comfort,
            furniture: housing.furniture || [],
            lastWeeklyBonus: housing.lastWeeklyBonus,
          }
        }
      },
    })

    this.registerComponentMapper('finance', {
      component: 'finance',
      syncFromWorld: (world, playerId, saveData) => {
        const finance = world.getComponent(playerId, 'finance') as Record<string, unknown> | null
        if (finance) {
          saveData.finance = {
            reserveFund: finance.reserveFund,
            monthlyExpenses: finance.monthlyExpenses,
            lastMonthlySettlement: finance.lastMonthlySettlement,
          }
        }
      },
    })

    this.registerComponentMapper('lifetimeStats', {
      component: 'lifetimeStats',
      syncFromWorld: (world, playerId, saveData) => {
        const lifetimeStats = world.getComponent(playerId, 'lifetimeStats') as Record<string, unknown> | null
        if (lifetimeStats) {
          saveData.lifetimeStats = {
            totalWorkDays: lifetimeStats.totalWorkDays,
            totalWorkHours: lifetimeStats.totalWorkHours,
            totalEvents: lifetimeStats.totalEvents,
            totalMicroEvents: lifetimeStats.totalMicroEvents,
            maxMoney: lifetimeStats.maxMoney,
          }
        }
      },
    })

    this.registerComponentMapper('relationships', {
      component: 'relationships',
      syncFromWorld: (world, playerId, saveData) => {
        const relationships = world.getComponent(playerId, 'relationships')
        if (relationships) saveData.relationships = relationships
      },
    })

    this.registerComponentMapper('eventHistory', {
      component: 'eventHistory',
      syncFromWorld: (world, playerId, saveData) => {
        const eventHistory = world.getComponent(playerId, 'eventHistory') as Record<string, unknown> | null
        if (eventHistory) {
          saveData.eventHistory = (eventHistory.events || []) as unknown[]
          if (!saveData.lifetimeStats) saveData.lifetimeStats = {}
          ;(saveData.lifetimeStats as Record<string, unknown>).totalEvents = eventHistory.totalEvents
          ;(saveData.lifetimeStats as Record<string, unknown>).totalMicroEvents = (
            (eventHistory.events || []) as unknown[]
          ).filter((item: unknown) => (item as Record<string, unknown>).type === 'micro').length
        }
      },
    })

    this.registerComponentMapper('eventQueue', {
      component: 'eventQueue',
      syncFromWorld: (world, playerId, saveData) => {
        const eventQueue = world.getComponent(playerId, 'eventQueue') as Record<string, unknown> | null
        if (eventQueue) {
          saveData.pendingEvents = eventQueue.pendingEvents || []
        }
      },
    })

    this.registerComponentMapper('investment', {
      component: 'investment',
      syncFromWorld: (world, playerId, saveData) => {
        const investments = world.getComponent(playerId, 'investment')
        if (investments) saveData.investments = investments
      },
    })

    this.registerComponentMapper(TAGS_COMPONENT, {
      component: TAGS_COMPONENT,
      syncFromWorld: (world, playerId, saveData) => {
        const tags = world.getComponent(playerId, TAGS_COMPONENT) as { items?: unknown[] } | null
        if (tags && Array.isArray(tags.items)) {
          saveData.tags = { items: [...tags.items] as CharacterTag[] }
        }
      },
    })
  }

  loadSave(): SaveData {
    const stored = window.localStorage.getItem(this.saveKey)

    if (!stored) {
      return this._createDefaultSave()
    }

    try {
      const parsed = JSON.parse(stored) as Record<string, unknown>
      return this.hydrateFromRecord(parsed, stored)
    } catch (error) {
      console.warn('Не удалось прочитать сохранение, использую демо-данные.', error)
      window.localStorage.setItem('game-life-save-backup', stored)
      return this._createDefaultSave()
    }
  }

  /**
   * Загрузка из уже распарсенного JSON (например, из SaveRepository).
   * @param rawJson исходная строка для backup при corruption
   */
  hydrateFromRecord(parsed: Record<string, unknown>, rawJson?: string): SaveData {
    const validation = this._validateSave(parsed)
    if (!validation.isValid) {
      console.warn('Валидация сохранения не прошла:', validation.errors)
      if (rawJson) {
        window.localStorage.setItem('game-life-save-backup', rawJson)
      }
    }

    const migrated = this.migrationSystem.applyMigrations({ ...parsed })
    const finalized = this._finalizeSaveShape(migrated)
    return this._mergeAndMigrate(finalized) as unknown as SaveData
  }

  saveGame(saveData: Record<string, unknown>): void {
    if (!saveData.version) {
      saveData.version = this.migrationSystem.getCurrentVersion()
    }
    if (typeof saveData.saveVersion !== 'number') {
      saveData.saveVersion = this.migrationSystem.getSaveVersionNumber()
    }

    if (this.world) {
      this.syncFromWorld(saveData)
    }

    saveData.saveTime = Date.now()
    window.localStorage.setItem(this.saveKey, JSON.stringify(saveData))
  }

  _createDefaultSave(): SaveData {
    return structuredClone(DEFAULT_SAVE)
  }

  _mergeAndMigrate(parsed: Record<string, unknown>): Record<string, unknown> {
    const base = structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>
    const baseCurrentJob = (base.currentJob ?? {}) as Record<string, unknown>
    const parsedHasJob = parsed.currentJob && ((parsed.currentJob as Record<string, unknown>).id)
    const parsedCurrentJob = parsedHasJob ? (parsed.currentJob as Record<string, unknown>) : {}

    const baseRelationships = (base.relationships ?? []) as Array<Record<string, unknown>>
    const parsedRelationships = parsed.relationships
    const mergedRelationships = Array.isArray(parsedRelationships)
      ? mergeById(baseRelationships, parsedRelationships, 'id')
      : baseRelationships

    const baseInvestments = (base.investments ?? []) as unknown[]
    const parsedInvestments = parsed.investments
    const mergedInvestments = Array.isArray(parsedInvestments)
      ? mergePrimitiveArrays(baseInvestments as never[], parsedInvestments)
      : [...baseInvestments]

    const baseFurniture = (((base.housing as Record<string, unknown>)?.furniture ?? []) as unknown[])
    const parsedHousing = (parsed.housing ?? {}) as Record<string, unknown>
    const mergedFurniture = mergePrimitiveArrays(baseFurniture, parsedHousing.furniture ?? [])

    const baseCourses = (((base.education as Record<string, unknown>)?.activeCourses ?? []) as unknown[])
    const parsedEducation = (parsed.education ?? {}) as Record<string, unknown>
    const mergedCourses = mergePrimitiveArrays(baseCourses, parsedEducation.activeCourses ?? [])

    const baseCompleted = (((base.education as Record<string, unknown>)?.completedPrograms ?? []) as Record<string, unknown>[])
    const mergedCompleted = mergeById(
      baseCompleted,
      (parsedEducation.completedPrograms ?? []) as unknown[],
      'id',
    ) as unknown[]

    return {
      ...base,
      ...parsed,
      version: parsed.version || '0.1.0',
      saveVersion: typeof parsed.saveVersion === 'number' ? parsed.saveVersion : this.migrationSystem.getSaveVersionNumber(),
      stats: {
        ...(base.stats as Record<string, unknown>),
        ...((parsed.stats ?? {}) as Record<string, unknown>),
      },
      currentJob: parsedHasJob
        ? {
            ...baseCurrentJob,
            ...parsedCurrentJob,
            salaryPerHour: parsedCurrentJob.salaryPerHour ?? resolveSalaryPerHour(parsedCurrentJob),
            salaryPerDay: parsedCurrentJob.salaryPerDay ?? resolveSalaryPerHour(parsedCurrentJob) * 8,
            salaryPerWeek: parsedCurrentJob.salaryPerWeek ?? resolveSalaryPerHour(parsedCurrentJob) * 40,
          }
        : null,
      housing: {
        ...(base.housing as Record<string, unknown>),
        ...((parsed.housing ?? {}) as Record<string, unknown>),
        furniture: mergedFurniture,
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
        activeCourses: mergedCourses,
        completedPrograms: mergedCompleted,
      },
      finance: {
        ...(base.finance as Record<string, unknown>),
        ...((parsed.finance ?? {}) as Record<string, unknown>),
        monthlyExpenses: {
          ...((base.finance as Record<string, unknown>).monthlyExpenses as Record<string, unknown>),
          ...(((parsed.finance as Record<string, unknown>)?.monthlyExpenses ?? {}) as Record<string, unknown>),
        },
      },
      relationships: mergedRelationships,
      investments: mergedInvestments,
      eventHistory: Array.isArray(parsed.eventHistory)
        ? mergePrimitiveArrays((base.eventHistory ?? []) as never[], parsed.eventHistory)
        : base.eventHistory,
      pendingEvents: Array.isArray(parsed.pendingEvents)
        ? mergePrimitiveArrays((base.pendingEvents ?? []) as never[], parsed.pendingEvents)
        : base.pendingEvents,
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
      tags: ((): { items: CharacterTag[] } => {
        const p = parsed.tags
        if (p && typeof p === 'object' && Array.isArray((p as Record<string, unknown>).items)) {
          return { items: [...((p as { items: CharacterTag[] }).items)] }
        }
        return { items: [] }
      })(),
    }
  }

  /** Публичный API: ECS → плоский save */
  syncFromWorld(saveData: Record<string, unknown>): void {
    this._syncFromWorld(saveData)
  }

  _syncFromWorld(saveData: Record<string, unknown>): void {
    const playerId = PLAYER_ENTITY
    for (const mapper of this.componentRegistry.values()) {
      mapper.syncFromWorld(this.world, playerId, saveData)
    }
  }

  _validateSave(saveData: Record<string, unknown>): ValidationResult {
    return this.migrationSystem.validateSave(saveData)
  }

  private _finalizeSaveShape(saveData: Record<string, unknown>): Record<string, unknown> {
    if (saveData.version !== this.migrationSystem.getCurrentVersion()) {
      saveData.version = this.migrationSystem.getCurrentVersion()
    }

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
      currentJob.salaryPerHour = resolveSalaryPerHour(currentJob)
    }
    if (typeof currentJob.salaryPerDay !== 'number') {
      currentJob.salaryPerDay = (currentJob.salaryPerHour as number) * 8
    }
    if (typeof currentJob.salaryPerWeek !== 'number') {
      currentJob.salaryPerWeek = (currentJob.salaryPerHour as number) * 40
    }

    if (saveData.currentJob && typeof saveData.currentJob === 'object') {
      saveData.currentJob = normalizeJobShape(saveData.currentJob as Record<string, unknown>) ?? {}
    }

    return saveData
  }

  normalizeJobShape(currentJob: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
    return normalizeJobShape(currentJob)
  }

  _resolveSalaryPerHour(job: Record<string, unknown> = {}): number {
    return resolveSalaryPerHour(job)
  }

  clearSave(): void {
    window.localStorage.removeItem(this.saveKey)
  }

  hasSave(): boolean {
    return Boolean(window.localStorage.getItem(this.saveKey))
  }
}

export type { ValidationResult, ComponentMapper, MigrationFn } from './index.types'
