/**
 * Миграция сохранений для event system под текущий shape Pinia events-store.
 */
import type {
  CanonicalEventHistoryEntry,
  CanonicalEventQueueItem,
  LegacyEventHistoryEntry,
  LegacyEventQueueItem,
  MigrationResult,
} from './save-event-migration.types'

export type {
  CanonicalEventHistoryEntry,
  CanonicalEventQueueItem,
  LegacyEventHistoryEntry,
  LegacyEventQueueItem,
  MigrationResult,
} from './save-event-migration.types'

/** Версия схемы событий. */
export const EVENT_SCHEMA_VERSION: number = 2

/**
 * Мигрирует legacy queue item в canonical формат.
 * @description [Infrastructure] - добавляет instanceId и period-поля.
 * @return { CanonicalEventQueueItem }
 */
export function migrateQueueItem(legacy: LegacyEventQueueItem, totalHours: number): CanonicalEventQueueItem {
  const day: number = typeof legacy.day === 'number' ? legacy.day : Math.floor(totalHours / 24)

  return {
    id: legacy.id,
    instanceId: legacy.instanceId ?? `${legacy.id}_${totalHours}_${Date.now()}`,
    type: legacy.type,
    title: legacy.title,
    description: legacy.description,
    choices: legacy.choices,
    data: legacy.data,
    day,
    week: Math.floor(day / 7) + 1,
    month: Math.floor(day / 30) + 1,
    year: Math.floor(day / 365) + 1,
    priority: 'normal',
  }
}

/**
 * Мигрирует legacy history entry в canonical формат.
 * @description [Infrastructure] - нормализует templateId/instanceId.
 * @return { CanonicalEventHistoryEntry }
 */
export function migrateHistoryEntry(
  legacy: LegacyEventHistoryEntry,
  totalHours: number,
): CanonicalEventHistoryEntry {
  const templateId: string = legacy.templateId ?? legacy.eventId ?? 'unknown'
  const day: number = typeof legacy.day === 'number' ? legacy.day : 0

  return {
    instanceId: legacy.instanceId ?? `${templateId}_${totalHours}_${Date.now()}`,
    templateId,
    day,
    week: Math.floor(day / 7) + 1,
    month: Math.floor(day / 30) + 1,
    year: Math.floor(day / 365) + 1,
    choiceId: legacy.choiceId,
    choiceText: legacy.choiceText,
    effects: legacy.effects,
    resolvedAt: totalHours,
  }
}

function readTotalHours(payload: Record<string, unknown>): number {
  const time: Record<string, unknown> | null =
    typeof payload.time === 'object' && payload.time !== null
      ? (payload.time as Record<string, unknown>)
      : null

  return typeof time?.totalHours === 'number' ? time.totalHours : 0
}

function ensureEventsBucket(payload: Record<string, unknown>): Record<string, unknown> {
  if (typeof payload.events === 'object' && payload.events !== null) {
    return payload.events as Record<string, unknown>
  }

  const events: Record<string, unknown> = {
    eventQueue: [],
    eventHistory: [],
    seenEventIds: [],
    currentEvent: null,
  }

  const legacyQueue: Record<string, unknown> | null =
    typeof payload.event_queue === 'object' && payload.event_queue !== null
      ? (payload.event_queue as Record<string, unknown>)
      : null

  if (Array.isArray(legacyQueue?.pendingEvents)) {
    events.eventQueue = legacyQueue.pendingEvents
  }

  const legacyHistory: Record<string, unknown> | null =
    typeof payload.event_history === 'object' && payload.event_history !== null
      ? (payload.event_history as Record<string, unknown>)
      : null

  if (Array.isArray(legacyHistory?.events)) {
    events.eventHistory = legacyHistory.events
  }

  payload.events = events
  delete payload.event_queue
  delete payload.event_history

  return events
}

function needsQueueMigration(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return true
  const record: Record<string, unknown> = item as Record<string, unknown>
  return typeof record.instanceId !== 'string' || typeof record.id !== 'string'
}

function needsHistoryMigration(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return true
  const record: Record<string, unknown> = item as Record<string, unknown>
  return typeof record.instanceId !== 'string' || typeof record.templateId !== 'string'
}

/**
 * Мигрирует весь save payload под events.* shape.
 * @description [Infrastructure] - мутирует payload in-place.
 * @return { MigrationResult }
 */
export function migrateSave(payload: Record<string, unknown>): MigrationResult {
  const result: MigrationResult = {
    success: true,
    fromVersion: typeof payload.eventSchemaVersion === 'number' ? payload.eventSchemaVersion : 1,
    toVersion: EVENT_SCHEMA_VERSION,
    migratedEvents: 0,
    errors: [],
  }

  try {
    const events: Record<string, unknown> = ensureEventsBucket(payload)
    const totalHours: number = readTotalHours(payload)

    if (Array.isArray(events.eventQueue)) {
      const queue: unknown[] = events.eventQueue
      events.eventQueue = queue.map((item: unknown) => {
        if (!needsQueueMigration(item) && typeof item === 'object' && item !== null) {
          const record: Record<string, unknown> = item as Record<string, unknown>

          if (typeof record.priority !== 'string') record.priority = 'normal'

          return record
        }

        result.migratedEvents += 1
        return migrateQueueItem(item as LegacyEventQueueItem, totalHours)
      })
    }

    if (Array.isArray(events.eventHistory)) {
      const history: unknown[] = events.eventHistory
      events.eventHistory = history.map((item: unknown) => {
        if (!needsHistoryMigration(item)) return item

        result.migratedEvents += 1
        return migrateHistoryEntry(item as LegacyEventHistoryEntry, totalHours)
      })
    }

    if (!Array.isArray(events.seenEventIds)) {
      events.seenEventIds = []
    }

    if (!('currentEvent' in events)) {
      events.currentEvent = null
    }

    payload.eventSchemaVersion = EVENT_SCHEMA_VERSION
  } catch (error: unknown) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/**
 * Проверяет, нужна ли миграция.
 * @description [Infrastructure] - по eventSchemaVersion.
 * @return { boolean }
 */
export function needsMigration(payload: Record<string, unknown>): boolean {
  const currentVersion: number =
    typeof payload.eventSchemaVersion === 'number' ? payload.eventSchemaVersion : 1

  return currentVersion < EVENT_SCHEMA_VERSION
}
