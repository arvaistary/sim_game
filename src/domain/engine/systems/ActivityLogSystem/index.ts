import {
  ACTIVITY_LOG_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'
import type { LogTimestamp, LogEntry, LogComponent, GetEntriesOptions, GetEntriesResult, GetEntriesWindowOptions, GetEntriesWindowResult, EventListenerEntry, LogStats } from './index.types'
import { LOG_ENTRY_TYPES, MAX_ENTRIES } from './index.constants'
import { telemetryInc } from '../../utils/telemetry'

export type { LogEntry, GetEntriesResult, GetEntriesWindowResult }
export { LOG_ENTRY_TYPES }

/**
 * Система логирования активности игрока
 * Подписывается на события eventBus и собирает записи в ACTIVITY_LOG_COMPONENT
 */
export class ActivityLogSystem {
  private world!: GameWorld
  private _listeners: EventListenerEntry[] = []

  init(world: GameWorld): void {
    this.world = world

    this._ensureComponent()
    this._trimEntriesIfNeeded()

    this._subscribeToEvents()
  }

  _trimEntriesIfNeeded(): void {
    const log = this._getLog()
    if (!log?.entries?.length) return
    if (log.entries.length > MAX_ENTRIES) {
      const trimmed = log.entries.length - MAX_ENTRIES
      log.entries = log.entries.slice(-MAX_ENTRIES)
      telemetryInc('activity_log_trimmed', trimmed)
    }
  }

  addEntry(entryData: {
    type: string
    category?: string | null
    title?: string
    description?: string
    icon?: string | null
    metadata?: Record<string, unknown>
  }): LogEntry | null {
    const log = this._getLog()
    if (!log) return null

    const timestamp = this._getCurrentTimestamp()

    const lastEntry = log.entries[log.entries.length - 1]
    if (lastEntry) {
      if (lastEntry.type === entryData.type && lastEntry.title === (entryData.title || '') && lastEntry.timestamp.hour === timestamp.hour) {
        return null
      }
    }

    const entry: LogEntry = {
      id: log.totalEntries,
      type: entryData.type,
      category: entryData.category || null,
      title: entryData.title || '',
      description: entryData.description || '',
      icon: entryData.icon ?? null,
      timestamp,
      metadata: entryData.metadata || {},
      createdAt: Date.now(),
    }

    log.entries.push(entry)

    telemetryInc(`activity_log_entry:${entryData.type}`)
    telemetryInc('activity_log_total')

    if (log.entries.length > MAX_ENTRIES) {
      log.entries.shift()
      telemetryInc('activity_log_trimmed')
    }

    log.totalEntries++

    return entry
  }

  getEntries(options: GetEntriesOptions = {}): GetEntriesResult {
    const log = this._getLog()
    if (!log) return { entries: [], total: 0, hasMore: false }

    const { limit = 50, offset = 0, type, sinceTotalHours } = options

    const filtered = this._filterEntries(log.entries, { type, sinceTotalHours })

    const total = filtered.length
    const sliced = filtered.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return { entries: sliced, total, hasMore }
  }

  getEntriesWindowEndingAt(options: GetEntriesWindowOptions = {}): GetEntriesWindowResult {
    const log = this._getLog()
    if (!log) {
      return { entries: [], total: 0, hasMoreOlder: false, rangeStart: 0, rangeEnd: 0 }
    }

    const { limit = 50, type, sinceTotalHours, endBefore } = options
    const filtered = this._filterEntries(log.entries, { type: type ?? undefined, sinceTotalHours })
    const total = filtered.length
    const end = typeof endBefore === 'number' ? Math.min(endBefore, total) : total
    const start = Math.max(0, end - limit)
    const entries = filtered.slice(start, end)

    return {
      entries,
      total,
      hasMoreOlder: start > 0,
      rangeStart: start,
      rangeEnd: end,
    }
  }

  _filterEntries(entries: LogEntry[], { type, sinceTotalHours }: { type?: string; sinceTotalHours?: number } = {}): LogEntry[] {
    let filtered = entries
    if (type) {
      filtered = filtered.filter((e) => e.type === type)
    }
    if (typeof sinceTotalHours === 'number') {
      filtered = filtered.filter((e) => e.timestamp.totalHours > sinceTotalHours)
    }
    return filtered
  }

  getRecentEntries(count = 10): LogEntry[] {
    const log = this._getLog()
    if (!log) return []

    return log.entries.slice(-count)
  }

  getEntriesByType(type: string, limit = 50): LogEntry[] {
    const log = this._getLog()
    if (!log) return []

    return log.entries
      .filter(e => e.type === type)
      .slice(-limit)
  }

  getLogStats(): LogStats {
    const log = this._getLog()
    if (!log) return { total: 0, byType: {}, lastEntryType: null }

    const byType: Record<string, number> = {}
    for (const entry of log.entries || []) {
      byType[entry.type] = (byType[entry.type] || 0) + 1
    }

    return {
      total: log.totalEntries || 0,
      byType,
      lastEntryType: log.entries?.[log.entries.length - 1]?.type || null
    }
  }

  clearOldEntries(maxAge: number): number {
    const log = this._getLog()
    if (!log) return 0

    const before = log.entries.length
    log.entries = log.entries.filter(e => e.timestamp.totalHours >= maxAge)

    return before - log.entries.length
  }

  _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT, {
        entries: [],
        totalEntries: 0,
      })
    }
  }

  _getLog(): LogComponent | null {
    return this.world.getComponent(PLAYER_ENTITY, ACTIVITY_LOG_COMPONENT) as LogComponent | null
  }

  _getCurrentTimestamp(): LogTimestamp {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null

    if (!time) {
      return {
        day: 0,
        week: 0,
        month: 0,
        year: 0,
        hour: 0,
        totalHours: 0,
        age: 0,
      }
    }

    return {
      day: (time.gameDays as number) ?? 0,
      week: (time.gameWeeks as number) ?? 0,
      month: (time.gameMonths as number) ?? 0,
      year: (time.gameYears as number) ?? 0,
      hour: (time.hourOfDay as number) ?? 0,
      totalHours: (time.totalHours as number) ?? 0,
      age: (time.currentAge as number) ?? 0,
    }
  }

  _subscribeToEvents(): void {
    const bus = this.world.eventBus

    const eventMap: Array<[string, string]> = [
      ['activity:action',      LOG_ENTRY_TYPES.ACTION],
      ['activity:event',       LOG_ENTRY_TYPES.EVENT],
      ['activity:stat',        LOG_ENTRY_TYPES.STAT_CHANGE],
      ['activity:skill',       LOG_ENTRY_TYPES.SKILL_CHANGE],
      ['activity:finance',     LOG_ENTRY_TYPES.FINANCE],
      ['activity:career',      LOG_ENTRY_TYPES.CAREER],
      ['activity:navigation',  LOG_ENTRY_TYPES.NAVIGATION],
      ['activity:prevented',   LOG_ENTRY_TYPES.PREVENTED],
      ['activity:time',        LOG_ENTRY_TYPES.TIME],
      ['activity:education',   LOG_ENTRY_TYPES.EDUCATION],
    ]

    for (const [eventName, type] of eventMap) {
      const handler = ((event: Event) => {
        const detail = (event as CustomEvent).detail || {} as Record<string, unknown>
        this.addEntry({
          type,
          category: (detail.category as string) || null,
          title: (detail.title as string) || '',
          description: (detail.description as string) || '',
          icon: (detail.icon as string | null) ?? null,
          metadata: (detail.metadata as Record<string, unknown>) || {},
        })
      }) as EventListener

      bus.addEventListener(eventName, handler)
      this._listeners.push({ eventName, handler })
    }
  }

  destroy(): void {
    const bus = this.world?.eventBus
    if (!bus) return

    for (const { eventName, handler } of this._listeners) {
      bus.removeEventListener(eventName, handler)
    }

    this._listeners = []
  }
}
