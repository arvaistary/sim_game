import {
  EVENT_HISTORY_COMPONENT,
  TIME_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'
import type { HistoryEvent, EventStats } from './index.types'
import { MAX_HISTORY_ENTRIES } from './index.constants'
import { telemetryInc } from '../../utils/telemetry'

/**
 * Система истории событий
 */
export class EventHistorySystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
  }

  /**
   * Записывает событие в историю
   * @param instanceId - Уникальный ID инстанса события
   * @param templateId - ID шаблона события
   * @param title - Заголовок события
   * @param type - Тип события
   * @param actionSource - Источник действия
   * @param choiceId - ID выбранного варианта (опционально)
   * @param choiceText - Текст выбранного варианта (опционально)
   * @param effects - Эффекты события (опционально)
   * @returns true если событие записано, false если дубликат
   */
  recordEvent(
    instanceId: string,
    templateId: string,
    title: string,
    type = 'story',
    actionSource: string | null = null,
    choiceId?: string,
    choiceText?: string,
    effects?: Record<string, number>,
  ): boolean {
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

    // Проверка дедупликации по instanceId
    const isDuplicate = events.some(e => e.instanceId === instanceId)
    if (isDuplicate) {
      telemetryInc('event_history_dedup')
      return false
    }

    events.push({
      instanceId,
      templateId,
      day: currentDay,
      week: time.gameWeeks,
      month: time.gameMonths,
      year: time.gameYears,
      timestampHours: time.totalHours ?? currentDay * 24,
      type,
      actionSource,
      title,
      choiceId,
      choiceText,
      effects,
      resolvedAt: time.totalHours,
    })

    if (events.length > MAX_HISTORY_ENTRIES) {
      events.splice(0, events.length - MAX_HISTORY_ENTRIES)
    }

    eventHistory.totalEvents = ((eventHistory.totalEvents as number) ?? 0) + 1

    telemetryInc('event_history_record')

    return true
  }

  /**
   * Легаси-метод для обратной совместимости
   * @deprecated Используйте recordEvent с instanceId и templateId
   */
  recordEventLegacy(eventId: string, title: string, type = 'story', actionSource: string | null = null): boolean {
    // Генерируем instanceId из eventId для обратной совместимости
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, number> | null
    const instanceId = time ? `${eventId}_${time.totalHours}` : `${eventId}_${Date.now()}`
    
    return this.recordEvent(instanceId, eventId, title, type, actionSource)
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

  getEventsByTemplateId(templateId: string): HistoryEvent[] {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return []
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    return events.filter(event => event.templateId === templateId).reverse()
  }

  /**
   * Легаси-метод для обратной совместимости
   * @deprecated Используйте getEventsByTemplateId
   */
  getEventsById(eventId: string): HistoryEvent[] {
    return this.getEventsByTemplateId(eventId)
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
      return { total: 0, byType: {}, lastInstanceId: null, lastTemplateId: null }
    }

    const events = (eventHistory.events || []) as HistoryEvent[]

    const byType: Record<string, number> = {}
    events.forEach(e => {
      byType[e.type] = (byType[e.type] ?? 0) + 1
    })

    const lastEvent = events.length > 0 ? events[events.length - 1] : null

    return {
      total: events.length,
      byType,
      lastInstanceId: lastEvent?.instanceId ?? null,
      lastTemplateId: lastEvent?.templateId ?? null,
    }
  }

  hasEventOccurred(templateId: string): boolean {
    const events = this.getEventsByTemplateId(templateId)
    return events.length > 0
  }

  getLastEventOccurrence(templateId: string): HistoryEvent | null {
    const events = this.getEventsByTemplateId(templateId)
    return events[0] || null
  }

  hasInstanceOccurred(instanceId: string): boolean {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return false
    }

    const events = (eventHistory.events || []) as HistoryEvent[]
    return events.some(e => e.instanceId === instanceId)
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

