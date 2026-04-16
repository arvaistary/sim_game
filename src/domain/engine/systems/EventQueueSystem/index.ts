import { telemetryInc } from '../../utils/telemetry'
import {
  EVENT_QUEUE_COMPONENT,
  EVENT_HISTORY_COMPONENT,
  PLAYER_ENTITY,
} from '../../components/index'
import type { GameWorld } from '../../world'

/**
 * Система управления очередью событий
 */
export class EventQueueSystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
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

  queuePendingEvent(event: Record<string, unknown>): boolean {
    const playerId = PLAYER_ENTITY
    const eventHistory = this.world.getComponent(playerId, EVENT_HISTORY_COMPONENT) as Record<string, unknown> | null

    if (!eventHistory) {
      return false
    }

    const instanceId = (event.instanceId as string) || `${event.id}_${Date.now()}`
    const historyEvents = (eventHistory.events || []) as Array<Record<string, unknown>>
    const alreadyHandled = historyEvents.some(item => item.eventId === instanceId)
    const queue = this._getEventQueue()
    const alreadyQueued = (queue.pendingEvents || []).some((item: unknown) => (item as Record<string, unknown>).instanceId === instanceId)

    if (alreadyHandled || alreadyQueued) {
      telemetryInc('event_dedup_hit')
      return false
    }

    const eventQueue = this.world.getComponent(playerId, EVENT_QUEUE_COMPONENT) as Record<string, unknown[]>
    if (!eventQueue.pendingEvents) {
      eventQueue.pendingEvents = []
    }
    eventQueue.pendingEvents.push({ ...event, instanceId })

    return true
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

