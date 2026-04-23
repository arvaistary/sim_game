/**
 * Миграция сохранений для event system
 */

/**
 * Версия схемы событий
 */
export const EVENT_SCHEMA_VERSION = 2

/**
 * Legacy формат события (версия 1)
 */
export interface LegacyEventQueueItem {
  id: string
  type: string
  title: string
  description: string
  choices?: Array<{
    id: string
    text: string
    effects?: Record<string, number>
  }>
  data?: Record<string, unknown>
  day: number
}

export interface LegacyEventHistoryEntry {
  eventId: string
  day: number
  choiceId?: string
  effects?: Record<string, number>
}

/**
 * Canonical формат события (версия 2)
 */
export interface CanonicalEventQueueItem {
  id: string
  instanceId: string
  type: string
  title: string
  description: string
  choices?: Array<{
    id: string
    text: string
    effects?: Record<string, number>
    outcome?: string
    skillCheck?: {
      key: string
      threshold: number
      successStatChanges?: Record<string, number>
      failStatChanges?: Record<string, number>
      successMoneyDelta?: number
      failMoneyDelta?: number
    }
  }>
  data?: Record<string, unknown>
  day: number
  week?: number
  month?: number
  year?: number
  _priority?: string
  _source?: string
}

export interface CanonicalEventHistoryEntry {
  instanceId: string
  templateId: string
  day: number
  week?: number
  month?: number
  year?: number
  choiceId?: string
  choiceText?: string
  effects?: Record<string, number>
  resolvedAt?: number
}

/**
 * Результат миграции
 */
export interface MigrationResult {
  success: boolean
  fromVersion: number
  toVersion: number
  migratedEvents: number
  errors: string[]
}

/**
 * Мигрирует legacy EventQueueItem в canonical формат
 * @param legacy - Legacy событие
 * @param totalHours - Текущее количество часов
 * @returns Canonical событие
 */
export function migrateQueueItem(legacy: LegacyEventQueueItem, totalHours: number): CanonicalEventQueueItem {
  return {
    ...legacy,
    instanceId: `${legacy.id}_${totalHours}_${Date.now()}`,
    week: Math.floor(legacy.day / 7) + 1,
    month: Math.floor(legacy.day / 30) + 1,
    year: Math.floor(legacy.day / 365) + 1,
    _priority: 'normal',
    _source: 'migrated',
  }
}

/**
 * Мигрирует legacy EventHistoryEntry в canonical формат
 * @param legacy - Legacy запись истории
 * @param totalHours - Текущее количество часов
 * @returns Canonical запись истории
 */
export function migrateHistoryEntry(legacy: LegacyEventHistoryEntry, totalHours: number): CanonicalEventHistoryEntry {
  return {
    instanceId: `${legacy.eventId}_${totalHours}_${Date.now()}`,
    templateId: legacy.eventId,
    day: legacy.day,
    week: Math.floor(legacy.day / 7) + 1,
    month: Math.floor(legacy.day / 30) + 1,
    year: Math.floor(legacy.day / 365) + 1,
    choiceId: legacy.choiceId,
    choiceText: undefined,
    effects: legacy.effects,
    resolvedAt: totalHours,
  }
}

/**
 * Мигрирует весь save payload
 * @param payload - Save payload
 * @returns Результат миграции
 */
export function migrateSave(payload: Record<string, unknown>): MigrationResult {
  const result: MigrationResult = {
    success: true,
    fromVersion: payload.eventSchemaVersion as number || 1,
    toVersion: EVENT_SCHEMA_VERSION,
    migratedEvents: 0,
    errors: [],
  }

  try {
    // Мигрируем eventQueue
    const eventQueue = payload.event_queue as Record<string, unknown> | null
    if (eventQueue && eventQueue.pendingEvents) {
      const pendingEvents = eventQueue.pendingEvents as LegacyEventQueueItem[]
      const time = payload.time as Record<string, number> | null
      const totalHours = time?.totalHours || 0

      eventQueue.pendingEvents = pendingEvents.map(event =>
        migrateQueueItem(event, totalHours)
      )
      result.migratedEvents += pendingEvents.length
    }

    // Мигрируем eventHistory
    const eventHistory = payload.event_history as Record<string, unknown> | null
    if (eventHistory && eventHistory.events) {
      const events = eventHistory.events as LegacyEventHistoryEntry[]
      const time = payload.time as Record<string, number> | null
      const totalHours = time?.totalHours || 0

      eventHistory.events = events.map(event =>
        migrateHistoryEntry(event, totalHours)
      )
      result.migratedEvents += events.length
    }

    // Обновляем версию схемы
    payload.eventSchemaVersion = EVENT_SCHEMA_VERSION

    // Инициализируем bounded индекс
    if (eventHistory && !eventHistory.seenInstanceIds) {
      eventHistory.seenInstanceIds = new Set<string>()
    }

    // Инициализируем period dedup sets
    const time = payload.time as Record<string, unknown> | null
    if (time && time.eventState) {
      const eventState = time.eventState as Record<string, unknown>
      if (!eventState.processedWeeklyEvents) {
        eventState.processedWeeklyEvents = new Set<string>()
      }
      if (!eventState.processedMonthlyEvents) {
        eventState.processedMonthlyEvents = new Set<string>()
      }
      if (!eventState.processedYearlyEvents) {
        eventState.processedYearlyEvents = new Set<string>()
      }
    }

  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/**
 * Проверяет, нужна ли миграция
 * @param payload - Save payload
 * @returns true если нужна миграция
 */
export function needsMigration(payload: Record<string, unknown>): boolean {
  const currentVersion = payload.eventSchemaVersion as number || 1
  return currentVersion < EVENT_SCHEMA_VERSION
}

/**
 * Валидирует структуру события после миграции
 * @param item - Событие для валидации
 * @returns true если валидно
 */
export function validateQueueItem(item: unknown): item is CanonicalEventQueueItem {
  if (typeof item !== 'object' || item === null) return false
  const queueItem = item as Record<string, unknown>

  return (
    typeof queueItem.id === 'string' &&
    typeof queueItem.instanceId === 'string' &&
    typeof queueItem.type === 'string' &&
    typeof queueItem.title === 'string' &&
    typeof queueItem.day === 'number'
  )
}

/**
 * Валидирует структуру записи истории после миграции
 * @param entry - Запись истории для валидации
 * @returns true если валидно
 */
export function validateHistoryEntry(entry: unknown): entry is CanonicalEventHistoryEntry {
  if (typeof entry !== 'object' || entry === null) return false
  const historyEntry = entry as Record<string, unknown>

  return (
    typeof historyEntry.instanceId === 'string' &&
    typeof historyEntry.templateId === 'string' &&
    typeof historyEntry.day === 'number'
  )
}
