import { PLAYER_ENTITY } from '../../components/index'
import type { GameWorld } from '../../world'
import type { MigrationFn, ValidationResult } from './index.types'
import { ORDERED_MIGRATION_VERSIONS, CURRENT_SAVE_VERSION } from './index.constants'
import { effectiveSaveVersion, semverLt } from './semver'
import { migrateFrom_0_1_0, migrateFrom_0_2_0 } from './flat-migrations'
import { EventMigration } from '@/infrastructure/persistence/event-migration'

export type { MigrationFn, ValidationResult, ComponentMapper } from './index.types'

export class MigrationSystem {
  private readonly eventMigration = new EventMigration()

  readonly currentVersion = '1.2.0'
  private readonly migrations: Record<string, MigrationFn>

  constructor() {
    this.migrations = {
      '0.1.0': migrateFrom_0_1_0,
      '0.2.0': migrateFrom_0_2_0,
      '1.2.0': this._migrateEvents.bind(this),
    }
  }

  getSaveVersionNumber(): number {
    return CURRENT_SAVE_VERSION
  }

  init(_world: GameWorld): void {
    // Зарезервировано под будущие миграции, завязанные на runtime-состояние мира.
  }

  getCurrentVersion(): string {
    return this.currentVersion
  }

  /**
   * Цепочка semver-миграций плоского save. После цикла выставляет version = currentVersion.
   */
  applyMigrations(saveData: Record<string, unknown>): Record<string, unknown> {
    let version = effectiveSaveVersion(saveData.version)

    for (const migrationVersion of ORDERED_MIGRATION_VERSIONS) {
      if (semverLt(version, migrationVersion)) {
        try {
          const migrateFn = this.migrations[migrationVersion]
          if (migrateFn) {
            saveData = migrateFn(saveData)
            saveData.version = migrationVersion
            version = migrationVersion
          }
        } catch (error) {
          console.error(`Migration failed at ${migrationVersion}: ${(error as Error).message}`, error)
        }
      }
    }

    if (saveData.version !== this.currentVersion) {
      saveData.version = this.currentVersion
    }

    return saveData
  }

  /**
   * Миграция событий к canonical формату (eventSchemaVersion 2).
   * Поддерживает плоский save (pendingEvents / eventHistory) и уже snake_case (event_queue / event_history).
   */
  private _migrateEvents(saveData: Record<string, unknown>): Record<string, unknown> {
    const queueWrapper = (saveData.event_queue as Record<string, unknown>) ?? {
      pendingEvents: (saveData.pendingEvents as unknown[]) ?? [],
    }
    const historyWrapper = (saveData.event_history as Record<string, unknown>) ?? {
      events: Array.isArray(saveData.eventHistory) ? (saveData.eventHistory as unknown[]) : [],
    }

    const payload: Record<string, unknown> = {
      eventSchemaVersion: (saveData.eventSchemaVersion as number) ?? 1,
      time: (saveData.time as Record<string, unknown>) ?? {},
      event_queue: queueWrapper,
      event_history: historyWrapper,
    }

    if (!this.eventMigration.needsMigration(payload)) {
      return saveData
    }

    const result = this.eventMigration.migrateSave(payload)

    if (!result.success) {
      console.warn('Event migration failed:', result.errors)
    } else {
      console.log(`Event migration completed: ${result.migratedEvents} events migrated`)
    }

    saveData.pendingEvents = (queueWrapper.pendingEvents ?? saveData.pendingEvents) as unknown[]
    saveData.eventHistory = (historyWrapper.events ?? saveData.eventHistory) as unknown[]
    saveData.event_queue = queueWrapper
    saveData.event_history = historyWrapper
    saveData.time = payload.time as Record<string, unknown>
    saveData.eventSchemaVersion = payload.eventSchemaVersion
    saveData.version = this.currentVersion
    return saveData
  }

  /**
   * Единая валидация плоского save (деньги, время, статы, работа, образование).
   */
  validateSave(saveData: Record<string, unknown>): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!saveData.version) {
      warnings.push('Отсутствует версия сохранения')
    }

    if (typeof saveData.money !== 'number' || Number.isNaN(saveData.money) || (saveData.money as number) < 0) {
      errors.push('Некорректное значение money (ожидается number >= 0)')
    }

    if (typeof saveData.gameDays !== 'number' || Number.isNaN(saveData.gameDays) || (saveData.gameDays as number) < 0) {
      errors.push('Некорректное значение gameDays (ожидается number >= 0)')
    }

    const time = saveData.time as Record<string, unknown> | undefined
    if (!time || typeof time !== 'object') {
      errors.push('Отсутствует или некорректен объект time')
    } else {
      const totalHours = Number(time.totalHours)
      if (!Number.isFinite(totalHours) || totalHours < 0) {
        errors.push('time.totalHours должен быть конечным числом >= 0')
      }
    }

    if (!saveData.stats || typeof saveData.stats !== 'object') {
      errors.push('stats должен быть непустым объектом')
    }

    const job = saveData.currentJob as Record<string, unknown> | null | undefined
    if (job !== null && job !== undefined && typeof job === 'object') {
      const id = job.id
      if (id !== null && typeof id !== 'string') {
        errors.push('currentJob.id должен быть string или null')
      }
    }

    const education = saveData.education as Record<string, unknown> | undefined
    if (!education || typeof education !== 'object') {
      errors.push('education должен быть объектом')
    } else if (typeof education.educationLevel !== 'string' || !education.educationLevel.trim()) {
      errors.push('education.educationLevel должен быть непустой строкой')
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

  createDefaultSave(): Record<string, unknown> {
    return {
      version: this.currentVersion,
      saveVersion: CURRENT_SAVE_VERSION,
    }
  }

  /**
   * Миграция событий внутри ECS snapshot (localStorage через world.toJSON).
   */
  migrateEngineSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
    const entities = snapshot.entities as Array<{ id: string; components: Record<string, unknown> }> | undefined
    if (!Array.isArray(entities)) {
      return snapshot
    }

    const cloned = structuredClone(snapshot) as Record<string, unknown>
    const clonedEntities = cloned.entities as Array<{ id: string; components: Record<string, unknown> }>

    const playerIndex = clonedEntities.findIndex(e => e.id === PLAYER_ENTITY)
    if (playerIndex < 0) return cloned

    const player = clonedEntities[playerIndex]
    const comps = { ...player.components }

    const time = (comps.time ?? {}) as Record<string, unknown>
    const eventQueue = (comps.event_queue ?? comps.eventQueue) as Record<string, unknown> | undefined
    const eventHistoryRaw = (comps.event_history ?? comps.eventHistory) as Record<string, unknown> | undefined

    const eventHistory =
      eventHistoryRaw && Array.isArray((eventHistoryRaw as { events?: unknown }).events)
        ? eventHistoryRaw
        : { events: (eventHistoryRaw as { history?: unknown[] })?.history ?? [] }

    const wrapper: Record<string, unknown> = {
      eventSchemaVersion: (snapshot.eventSchemaVersion as number) ?? 1,
      time,
      event_queue: eventQueue ?? { pendingEvents: [] },
      event_history: eventHistory,
    }

    if (!this.eventMigration.needsMigration(wrapper)) {
      return cloned
    }

    this.eventMigration.migrateSave(wrapper)

    comps.time = wrapper.time as Record<string, unknown>
    if (wrapper.event_queue) comps.event_queue = wrapper.event_queue as Record<string, unknown>
    if (wrapper.event_history) comps.event_history = wrapper.event_history as Record<string, unknown>

    ;(cloned as Record<string, unknown>).eventSchemaVersion = wrapper.eventSchemaVersion

    clonedEntities[playerIndex] = { ...player, components: comps }
    return cloned
  }
}
