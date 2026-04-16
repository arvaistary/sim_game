import {
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'
import type { HistoryEvent, EventStats } from './index.types'
import { MAX_HISTORY_ENTRIES } from './index.constants'

/**
 * Система истории событий
 */
export class EventHistorySystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
  }

  recordEvent(eventId: string, title: string, type = 'story', actionSource: string | null = null): boolean {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, number> | null
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!time || !eventHistory) {
      return false
    }

    if (!eventHistory.events) {
      eventHistory.events = []
    }

    const events = eventHistory.events as HistoryEvent[]
    const currentDay = time.gameDays

    const isDuplicate = events.some(e => e.eventId === eventId && e.day === currentDay)
    if (isDuplicate) {
      return false
    }

    events.push({
      eventId,
      day: currentDay,
      week: time.gameWeeks,
      timestampHours: time.totalHours ?? currentDay * 24,
      type,
      actionSource,
      title,
    })

    if (events.length > MAX_HISTORY_ENTRIES) {
      events.splice(0, events.length - MAX_HISTORY_ENTRIES)
    }

    eventHistory.totalEvents = ((eventHistory.totalEvents as number) ?? 0) + 1

    return true
  }

  getEventHistory(limit = 50): HistoryEvent[] {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return []
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    return events.slice(-limit).reverse()
  }

  getEventsById(eventId: string): HistoryEvent[] {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return []
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    return events.filter(event => event.eventId === eventId).reverse()
  }

  getRecentEvents(days = 30): HistoryEvent[] {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, number> | null
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!time || !eventHistory) {
      return []
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    const minDay = time.gameDays - days

    return events
      .filter(event => event.day >= minDay)
      .reverse()
  }

  getEventStats(): EventStats {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return { total: 0, byType: {}, lastEventId: null }
    }

    const events = (eventHistory.events || []) as HistoryEvent[]

    const byType: Record<string, number> = {}
    events.forEach(e => {
      byType[e.type] = (byType[e.type] ?? 0) + 1
    })

    const lastEventId = events.length > 0 ? events[events.length - 1].eventId : null

    return {
      total: events.length,
      byType,
      lastEventId,
    }
  }

  hasEventOccurred(eventId: string): boolean {
    const events = this.getEventsById(eventId)
    return events.length > 0
  }

  getLastEventOccurrence(eventId: string): HistoryEvent | null {
    const events = this.getEventsById(eventId)
    return events[0] || null
  }

  clearHistory(): void {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (eventHistory) {
      eventHistory.events = []
      eventHistory.totalEvents = 0
    }
  }

  getTotalEventCount(): number {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return 0
    }

    return (eventHistory.totalEvents as number) ?? 0
  }
}

