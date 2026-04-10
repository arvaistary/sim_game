import {
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'

interface HistoryEvent {
  eventId: string
  day: number
  week: number
  timestampHours: number
  type: string
  actionSource: string | null
  title: string
}

interface EventStats {
  total: number
  unique: number
  recentWeek: number
  recentMonth: number
}

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
    events.push({
      eventId,
      day: time.gameDays,
      week: time.gameWeeks,
      timestampHours: time.totalHours ?? (time.gameDays ?? 0) * 24,
      type,
      actionSource,
      title,
    })

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
      return { total: 0, unique: 0, recentWeek: 0, recentMonth: 0 }
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, number> | null

    const uniqueEvents = new Set(events.map(e => e.eventId))

    let recentWeek = 0
    let recentMonth = 0

    if (time) {
      const weekStart = time.gameDays - 7
      const monthStart = time.gameDays - 30

      recentWeek = events.filter(e => e.day >= weekStart).length
      recentMonth = events.filter(e => e.day >= monthStart).length
    }

    return {
      total: events.length,
      unique: uniqueEvents.size,
      recentWeek,
      recentMonth,
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

