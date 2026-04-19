import { telemetryInc } from '../../utils/telemetry'
import {
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  PLAYER_ENTITY,
  TIME_COMPONENT,
} from '../../components/index'
import type { GameWorld } from '../../world'
import { getGlobalTimeDiagnostics } from '../TimeSystem/TimeDiagnostics'
import { EventIngress } from './EventIngress'
import { EventDiagnostics } from './EventDiagnostics'
import type { EventIngressDTO, EventIngressResult, EventHistoryEntry, EventSource, EventPriority, EventChoice } from '../../types'

/**
 * Конфигурация bounded индекса для dedup
 */
const SEEN_INSTANCES_RETENTION_HOURS = 24 * 7 * 4 // 4 недели

/**
 * Система управления очередью событий
 */
export class EventQueueSystem {
  private world!: GameWorld
  private ingress = new EventIngress()
  private diagnostics = new EventDiagnostics()

  init(world: GameWorld): void {
    this.world = world
    this._ensureSeenInstancesIndex()
  }

  /**
   * Получает диагностику event pipeline
   * @returns Диагностика
   */
  getDiagnostics(): EventDiagnostics {
    return this.diagnostics
  }

  /**
   * Обеспечивает наличие bounded индекса seenInstanceIds
   */
  private _ensureSeenInstancesIndex(): void {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null
    if (eventHistory) {
      // Преобразуем массив в Set (при загрузке из сохранения Set превращается в массив)
      if (!eventHistory.seenInstanceIds || !(eventHistory.seenInstanceIds instanceof Set)) {
        const existing = eventHistory.seenInstanceIds
        eventHistory.seenInstanceIds = new Set<string>(Array.isArray(existing) ? existing : [])
      }
    }
  }

  /**
   * Получает bounded индекс seenInstanceIds
   */
  private _getSeenInstancesIndex(): Set<string> {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null
    if (!eventHistory?.seenInstanceIds) {
      this._ensureSeenInstancesIndex()
      const updated = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown>
      return updated.seenInstanceIds as Set<string>
    }
    return eventHistory.seenInstanceIds as Set<string>
  }

  /**
   * Очищает устаревшие записи из bounded индекса
   */
  private _cleanupSeenInstancesIndex(): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, number> | null
    if (!time) return

    const currentTotalHours = time.totalHours
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null
    if (!eventHistory?.events) return

    const historyEvents = eventHistory.events as EventHistoryEntry[]
    const seenIndex = this._getSeenInstancesIndex()

    // Удаляем записи старше retention периода
    for (const entry of historyEvents) {
      // Если у записи есть timestamp, проверяем по нему
      if (entry.resolvedAt) {
        const hoursSinceResolution = (currentTotalHours - entry.resolvedAt) / 3600
        if (hoursSinceResolution > SEEN_INSTANCES_RETENTION_HOURS) {
          seenIndex.delete(entry.instanceId)
        }
      }
    }
  }

  /**
   * Проверяет, был ли instanceId уже обработан (O(1))
   */
  private _isInstanceSeen(instanceId: string): boolean {
    const seenIndex = this._getSeenInstancesIndex()
    return seenIndex.has(instanceId)
  }

  /**
   * Добавляет instanceId в bounded индекс
   */
  private _markInstanceSeen(instanceId: string): void {
    const seenIndex = this._getSeenInstancesIndex()
    seenIndex.add(instanceId)
  }

  /**
   * Инициализирует period dedup sets в TimeComponent
   */
  private _ensurePeriodDedupSets(): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return

    const eventState = time.eventState as Record<string, unknown>
    
    // Преобразуем массивы в Set'ы (при загрузке из сохранения Set превращается в массив)
    if (!eventState.processedWeeklyEvents || !(eventState.processedWeeklyEvents instanceof Set)) {
      const existing = eventState.processedWeeklyEvents
      eventState.processedWeeklyEvents = new Set<string>(Array.isArray(existing) ? existing : [])
    }
    if (!eventState.processedMonthlyEvents || !(eventState.processedMonthlyEvents instanceof Set)) {
      const existing = eventState.processedMonthlyEvents
      eventState.processedMonthlyEvents = new Set<string>(Array.isArray(existing) ? existing : [])
    }
    if (!eventState.processedYearlyEvents || !(eventState.processedYearlyEvents instanceof Set)) {
      const existing = eventState.processedYearlyEvents
      eventState.processedYearlyEvents = new Set<string>(Array.isArray(existing) ? existing : [])
    }
  }

  /**
   * Генерирует weekly period dedup key
   * @param templateId - ID шаблона события
   * @param year - Год
   * @param week - Неделя
   * @returns Period dedup key
   */
  private _getWeeklyPeriodKey(templateId: string, year: number, week: number): string {
    return `${templateId}:${year}:${week}`
  }

  /**
   * Генерирует monthly period dedup key
   * @param templateId - ID шаблона события
   * @param year - Год
   * @param month - Месяц
   * @returns Period dedup key
   */
  private _getMonthlyPeriodKey(templateId: string, year: number, month: number): string {
    return `${templateId}:${year}:${month}`
  }

  /**
   * Генерирует yearly period dedup key
   * @param templateId - ID шаблона события
   * @param year - Год
   * @returns Period dedup key
   */
  private _getYearlyPeriodKey(templateId: string, year: number): string {
    return `${templateId}:${year}`
  }

  /**
   * Проверяет, было ли событие уже обработано в данном периоде
   * @param templateId - ID шаблона события
   * @param year - Год
   * @param week - Неделя (опционально)
   * @param month - Месяц (опционально)
   * @returns true если событие уже обработано
   */
  private _isPeriodEventProcessed(
    templateId: string,
    year: number,
    week?: number,
    month?: number,
  ): boolean {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return false

    this._ensurePeriodDedupSets()
    const eventState = time.eventState as Record<string, unknown>

    if (week !== undefined) {
      const weeklyEvents = eventState.processedWeeklyEvents as Set<string>
      const key = this._getWeeklyPeriodKey(templateId, year, week)
      return weeklyEvents.has(key)
    }

    if (month !== undefined) {
      const monthlyEvents = eventState.processedMonthlyEvents as Set<string>
      const key = this._getMonthlyPeriodKey(templateId, year, month)
      return monthlyEvents.has(key)
    }

    const yearlyEvents = eventState.processedYearlyEvents as Set<string>
    const key = this._getYearlyPeriodKey(templateId, year)
    return yearlyEvents.has(key)
  }

  /**
   * Отмечает событие как обработанное в данном периоде
   * @param templateId - ID шаблона события
   * @param year - Год
   * @param week - Неделя (опционально)
   * @param month - Месяц (опционально)
   */
  private _markPeriodEventProcessed(
    templateId: string,
    year: number,
    week?: number,
    month?: number,
  ): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return

    this._ensurePeriodDedupSets()
    const eventState = time.eventState as Record<string, unknown>

    if (week !== undefined) {
      const weeklyEvents = eventState.processedWeeklyEvents as Set<string>
      const key = this._getWeeklyPeriodKey(templateId, year, week)
      weeklyEvents.add(key)
    }

    if (month !== undefined) {
      const monthlyEvents = eventState.processedMonthlyEvents as Set<string>
      const key = this._getMonthlyPeriodKey(templateId, year, month)
      monthlyEvents.add(key)
    }

    if (week === undefined && month === undefined) {
      const yearlyEvents = eventState.processedYearlyEvents as Set<string>
      const key = this._getYearlyPeriodKey(templateId, year)
      yearlyEvents.add(key)
    }
  }

  /**
   * Очищает устаревшие period dedup keys
   * @param currentYear - Текущий год
   * @param currentMonth - Текущий месяц
   * @param currentWeek - Текущая неделя
   */
  private _cleanupPeriodDedupKeys(
    currentYear: number,
    currentMonth: number,
    currentWeek: number,
  ): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return

    this._ensurePeriodDedupSets()
    const eventState = time.eventState as Record<string, unknown>

    // Очищаем weekly events старше 4 недель
    const weeklyEvents = eventState.processedWeeklyEvents as Set<string>
    for (const key of weeklyEvents) {
      const [, yearStr, weekStr] = key.split(':')
      const year = parseInt(yearStr, 10)
      const week = parseInt(weekStr, 10)
      
      // Удаляем если старше 4 недель
      if (year < currentYear || (year === currentYear && week < currentWeek - 4)) {
        weeklyEvents.delete(key)
      }
    }

    // Очищаем monthly events старше 12 месяцев
    const monthlyEvents = eventState.processedMonthlyEvents as Set<string>
    for (const key of monthlyEvents) {
      const [, yearStr, monthStr] = key.split(':')
      const year = parseInt(yearStr, 10)
      const month = parseInt(monthStr, 10)
      
      // Удаляем если старше 12 месяцев
      if (year < currentYear || (year === currentYear && month < currentMonth - 12)) {
        monthlyEvents.delete(key)
      }
    }

    // Очищаем yearly events старше 5 лет
    const yearlyEvents = eventState.processedYearlyEvents as Set<string>
    for (const key of yearlyEvents) {
      const [, yearStr] = key.split(':')
      const year = parseInt(yearStr, 10)
      
      // Удаляем если старше 5 лет
      if (year < currentYear - 5) {
        yearlyEvents.delete(key)
      }
    }
  }

  /**
   * Единый EventIngress API для добавления событий в очередь
   * @param dto - DTO события
   * @returns Результат добавления
   */
  enqueueEvent(dto: EventIngressDTO): EventIngressResult {
    const startTime = performance.now()

    // Нормализация DTO
    const normalized = this.ingress.normalize(dto)
    if (!normalized) {
      const latency = performance.now() - startTime
      this.diagnostics.recordEnqueue(latency, 'rejected_invalid')
      return this.ingress.rejectedInvalid('Invalid event payload: missing required fields')
    }

    // Генерация/получение instanceId
    const instanceId = this.ingress.resolveInstanceId(normalized)

    // Проверка period dedup для period-driven событий
    const timeSnapshot = normalized.timeSnapshot
    if (timeSnapshot.week !== undefined) {
      if (this._isPeriodEventProcessed(normalized.templateId, timeSnapshot.year, timeSnapshot.week)) {
        telemetryInc('event_dedup_hit')
        getGlobalTimeDiagnostics().recordEventDedupHit()
        this.diagnostics.recordPeriodDedupHit('weekly')
        const latency = performance.now() - startTime
        this.diagnostics.recordEnqueue(latency, 'rejected_duplicate')
        return this.ingress.rejectedDuplicate(
          instanceId,
          `Weekly event already processed for week ${timeSnapshot.week}`,
        )
      }
    } else if (timeSnapshot.month !== undefined) {
      if (this._isPeriodEventProcessed(normalized.templateId, timeSnapshot.year, undefined, timeSnapshot.month)) {
        telemetryInc('event_dedup_hit')
        getGlobalTimeDiagnostics().recordEventDedupHit()
        this.diagnostics.recordPeriodDedupHit('monthly')
        const latency = performance.now() - startTime
        this.diagnostics.recordEnqueue(latency, 'rejected_duplicate')
        return this.ingress.rejectedDuplicate(
          instanceId,
          `Monthly event already processed for month ${timeSnapshot.month}`,
        )
      }
    } else {
      if (this._isPeriodEventProcessed(normalized.templateId, timeSnapshot.year)) {
        telemetryInc('event_dedup_hit')
        getGlobalTimeDiagnostics().recordEventDedupHit()
        this.diagnostics.recordPeriodDedupHit('yearly')
        const latency = performance.now() - startTime
        this.diagnostics.recordEnqueue(latency, 'rejected_duplicate')
        return this.ingress.rejectedDuplicate(
          instanceId,
          `Yearly event already processed for year ${timeSnapshot.year}`,
        )
      }
    }

    // Проверка дедупликации через bounded индекс (O(1))
    if (this._isInstanceSeen(instanceId)) {
      telemetryInc('event_dedup_hit')
      getGlobalTimeDiagnostics().recordEventDedupHit()
      const latency = performance.now() - startTime
      this.diagnostics.recordEnqueue(latency, 'rejected_duplicate')
      return this.ingress.rejectedDuplicate(instanceId, 'Event already seen in bounded index')
    }

    // Проверка дедупликации в очереди (для защиты от race conditions)
    const queue = this._getEventQueue()
    const alreadyQueued = (queue.pendingEvents || []).some(
      (item: unknown) => (item as Record<string, unknown>).instanceId === instanceId,
    )
    if (alreadyQueued) {
      telemetryInc('event_dedup_hit')
      getGlobalTimeDiagnostics().recordEventDedupHit()
      const latency = performance.now() - startTime
      this.diagnostics.recordEnqueue(latency, 'rejected_duplicate')
      return this.ingress.rejectedDuplicate(instanceId, 'Event already in queue')
    }

    // Преобразование в EventQueueItem
    const queueItem = this.ingress.toQueueItem(normalized)

    // Добавление в очередь с учётом приоритета
    const eventQueue = this.world.getComponent(PLAYER_ENTITY, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]>
    if (!eventQueue.pendingEvents) {
      eventQueue.pendingEvents = []
    }

    // Вставка с учётом приоритета
    const priority = (queueItem._priority as string) || 'normal'
    let insertIndex = eventQueue.pendingEvents.length
    for (let i = 0; i < eventQueue.pendingEvents.length; i++) {
      const item = eventQueue.pendingEvents[i] as Record<string, unknown>
      const itemPriority = (item._priority as string) || 'normal'
      if (this.ingress.comparePriority(queueItem, item) < 0) {
        insertIndex = i
        break
      }
    }
    eventQueue.pendingEvents.splice(insertIndex, 0, queueItem)

    // Отметка как seen
    this._markInstanceSeen(instanceId)

    // Отметка period event как обработанного
    if (timeSnapshot.week !== undefined) {
      this._markPeriodEventProcessed(normalized.templateId, timeSnapshot.year, timeSnapshot.week)
    } else if (timeSnapshot.month !== undefined) {
      this._markPeriodEventProcessed(normalized.templateId, timeSnapshot.year, undefined, timeSnapshot.month)
    } else {
      this._markPeriodEventProcessed(normalized.templateId, timeSnapshot.year)
    }

    // Периодическая очистка bounded индекса и period dedup keys
    this._cleanupSeenInstancesIndex()
    this._cleanupPeriodDedupKeys(timeSnapshot.year, timeSnapshot.month || 1, timeSnapshot.week || 1)

    // Записываем размер очереди
    this.diagnostics.recordQueueSize(eventQueue.pendingEvents.length)

    // Записываем метрику
    const latency = performance.now() - startTime
    this.diagnostics.recordEnqueue(latency, 'accepted')

    return this.ingress.accepted(instanceId)
  }

  /**
   * Легаси-метод для обратной совместимости
   * @deprecated Используйте enqueueEvent с EventIngressDTO
   */
  queuePendingEvent(event: Record<string, unknown>): boolean {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number> | null
    const totalHours = time?.totalHours ?? 0

    const dto: EventIngressDTO = {
      source: (event.source as EventSource) ?? 'other',
      templateId: (event.templateId as string) ?? (event.id as string) ?? `legacy_${Date.now()}`,
      priority: (event.priority as EventPriority) ?? 'normal',
      instanceId: (event.instanceId as string) || `${event.id ?? 'evt'}_${totalHours}`,
      timeSnapshot: {
        totalHours,
        day: (event.day as number) ?? Math.floor(totalHours / 24),
        week: (event.week as number) ?? Math.floor(totalHours / 168) + 1,
        month: (event.month as number) ?? Math.floor(totalHours / 672) + 1,
        year: (event.year as number) ?? Math.floor(totalHours / 672 / 12) + 1,
      },
      title: (event.title as string) ?? '',
      description: (event.description as string) ?? '',
      type: (event.type as string) ?? 'event',
      choices: (event.choices as EventChoice[]) ?? undefined,
      meta: (event.meta as Record<string, unknown>) ?? (event.data as Record<string, unknown>),
    }

    const result = this.enqueueEvent(dto)
    return result.status === 'accepted'
  }

  getNextEvent(): Record<string, unknown> | null {
    const playerId = PLAYER_ENTITY
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]> | null

    if (!eventQueue || !eventQueue.pendingEvents || eventQueue.pendingEvents.length === 0) {
      return null
    }

    return eventQueue.pendingEvents[0] as Record<string, unknown>
  }

  consumePendingEvent(): Record<string, unknown> | null {
    const playerId = PLAYER_ENTITY
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]> | null

    if (!eventQueue || !eventQueue.pendingEvents || eventQueue.pendingEvents.length === 0) {
      return null
    }

    return (eventQueue.pendingEvents.shift() as Record<string, unknown>) || null
  }

  getEventQueue(): { pendingEvents: unknown[]; count: number } {
    const playerId = PLAYER_ENTITY
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]> | null

    if (!eventQueue) {
      return { pendingEvents: [], count: 0 }
    }

    return {
      pendingEvents: eventQueue.pendingEvents || [],
      count: (eventQueue.pendingEvents || []).length,
    }
  }

  hasPendingEvents(): boolean {
    const queue = this.getEventQueue()
    return queue.count > 0
  }

  clearEventQueue(): void {
    const playerId = PLAYER_ENTITY
    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]> | null

    if (eventQueue) {
      eventQueue.pendingEvents = []
    }
  }

  getEventCount(): number {
    const queue = this.getEventQueue()
    return queue.count
  }

  _getEventQueue(): Record<string, unknown[]> {
    const playerId = PLAYER_ENTITY
    return (this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]>) || { pendingEvents: [] }
  }
}

