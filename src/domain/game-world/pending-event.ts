import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'
import { markEventSeen, pushEventHistoryEntry } from '@/domain/game-world/commands/mutations'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Найти первое pending-событие по template id (FIFO).
 * @description [Domain] - lookup для server resolve без UI payload.
 * @return { GameEventPayload | null }
 */
export function findPendingEventPayload(world: GameWorld, templateId: string): GameEventPayload | null {
  for (const queuedEvent of world.events.pending) {
    if (!isRecord(queuedEvent)) continue

    if (queuedEvent.id === templateId) return queuedEvent as unknown as GameEventPayload
  }

  return null
}

/**
 * Завершить pending-событие: history, seen, удаление из очереди.
 * @description [Domain] - мутирует world.events после успешного resolve.
 * @return { void }
 */
export function completePendingEventResolution(
  world: GameWorld,
  event: GameEventPayload,
  choiceId: string,
  choiceText: string,
  effects?: Record<string, number>,
): void {
  const instanceId: string = resolveInstanceId(world, event)
  const templateId: string = event.id

  pushEventHistoryEntry(world, {
    instanceId,
    templateId,
    choiceId,
    choiceText,
    effects,
  })
  markEventSeen(world, instanceId)
  removePendingEventByInstance(world, instanceId, templateId)
}

function resolveInstanceId(world: GameWorld, event: GameEventPayload): string {
  const record: Record<string, unknown> = event as unknown as Record<string, unknown>
  const explicitInstanceId: unknown = record.instanceId

  if (typeof explicitInstanceId === 'string' && explicitInstanceId.length > 0) return explicitInstanceId

  const index: number = world.events.pending.findIndex((queuedEvent: unknown) => {

    if (!isRecord(queuedEvent)) return false

    return queuedEvent.id === event.id
  })

  return `${event.id}_${index >= 0 ? index : 0}`
}

function removePendingEventByInstance(world: GameWorld, instanceId: string, templateId: string): void {
  const index: number = world.events.pending.findIndex((queuedEvent: unknown) => {

    if (!isRecord(queuedEvent)) return false

    const queuedInstanceId: unknown = queuedEvent.instanceId

    if (typeof queuedInstanceId === 'string' && queuedInstanceId === instanceId) return true

    return queuedEvent.id === templateId
  })

  if (index < 0) return

  world.events.pending.splice(index, 1)
}
