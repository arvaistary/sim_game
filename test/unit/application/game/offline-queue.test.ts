/**
 * Unit-тесты для OfflineQueueManager (Stage 5.5).
 *
 * Используют in-memory storage вместо localStorage. Проверяют enqueue,
 * size, hasPending, clear, syncWithServer (success и network failure).
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { OfflineQueueManager } from '@/application/game/offline-queue'
import type {
  OfflineQueueStorage,
  QueuedAction,
  ServerSyncClient,
  SyncOutcome,
} from '@/application/game/offline-queue.types'

function createMemoryStorage(): OfflineQueueStorage {
  const map: Map<string, string> = new Map()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
  }
}

describe('OfflineQueueManager', () => {
  let storage: OfflineQueueStorage

  beforeEach(() => {
    storage = createMemoryStorage()
  })

  it('enqueue добавляет действие в очередь', () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    const action: QueuedAction = queue.enqueue('action', { actionId: 'test' })

    expect(action.id).toBeDefined()
    expect(action.type).toBe('action')
    expect(action.payload.actionId).toBe('test')
    expect(queue.size()).toBe(1)
    expect(queue.hasPending()).toBe(true)
  })

  it('persist-ит в storage при enqueue', () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    queue.enqueue('action', { actionId: 'test' })

    const raw: string | null = storage.getItem('gl_offline_queue')
    expect(raw).not.toBeNull()
    const parsed: unknown = JSON.parse(raw ?? '[]')
    expect(Array.isArray(parsed)).toBe(true)
  })

  it('восстанавливает очередь из storage при construction', () => {
    storage.setItem('gl_offline_queue', JSON.stringify([
      { id: 'x1', type: 'action', timestamp: 1, payload: { actionId: 'a' } },
    ]))
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)

    expect(queue.size()).toBe(1)
    expect(queue.snapshot()[0]?.id).toBe('x1')
  })

  it('clear очищает очередь', () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    queue.enqueue('action', { actionId: 'test' })
    queue.clear()

    expect(queue.size()).toBe(0)
    expect(queue.hasPending()).toBe(false)
  })

  it('syncWithServer success: очищает очередь и возвращает applied count', async () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    queue.enqueue('action', { actionId: 'a1' })
    queue.enqueue('action', { actionId: 'a2' })

    const syncClient: ServerSyncClient = async () => ({
      success: true,
      data: { state: {} as never, applied: 2, failed: 0 },
      timestamp: Date.now(),
    })

    const outcome: SyncOutcome = await queue.syncWithServer(syncClient)

    expect(outcome.applied).toBe(2)
    expect(outcome.failed).toBe(0)
    expect(outcome.remaining).toBe(0)
    expect(queue.size()).toBe(0)
  })

  it('syncWithServer network error: оставляет очередь для retry', async () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    queue.enqueue('action', { actionId: 'a1' })

    const syncClient: ServerSyncClient = async () => {
      throw new Error('Network error')
    }

    const outcome: SyncOutcome = await queue.syncWithServer(syncClient)

    expect(outcome.applied).toBe(0)
    expect(outcome.failed).toBe(1)
    expect(outcome.remaining).toBe(1)
    expect(queue.size()).toBe(1)
  })

  it('syncWithServer server error: оставляет очередь', async () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)
    queue.enqueue('action', { actionId: 'a1' })

    const syncClient: ServerSyncClient = async () => ({
      success: false,
      error: { code: 'internal_error', message: 'Server failed' },
      timestamp: Date.now(),
    })

    const outcome: SyncOutcome = await queue.syncWithServer(syncClient)

    expect(outcome.applied).toBe(0)
    expect(outcome.failed).toBe(1)
    expect(outcome.remaining).toBe(1)
  })

  it('syncWithServer пустой очереди: no-op', async () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)

    let called: boolean = false
    const syncClient: ServerSyncClient = async () => {
      called = true
      return { success: true, data: { state: {} as never, applied: 0, failed: 0 }, timestamp: Date.now() }
    }

    const outcome: SyncOutcome = await queue.syncWithServer(syncClient)

    expect(called).toBe(false)
    expect(outcome.applied).toBe(0)
    expect(outcome.remaining).toBe(0)
  })

  it('truncate при превышении MAX_QUEUE_SIZE', () => {
    const queue: OfflineQueueManager = new OfflineQueueManager(storage)

    for (let i: number = 0; i < 110; i++) {
      queue.enqueue('action', { index: i })
    }

    expect(queue.size()).toBeLessThanOrEqual(100)
  })
})
