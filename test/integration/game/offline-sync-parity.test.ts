import { describe, expect, it } from 'vitest'
import { OfflineQueueManager } from '@/application/game/offline-queue'

describe('offline sync parity', () => {
  it('replays ordered actions once and clears queue after acknowledged sync', async () => {
    const queue = new OfflineQueueManager({ getItem: () => null, setItem: () => undefined, removeItem: () => undefined })
    const first = queue.enqueue('action', { actionId: 'health_checkup' })
    const second = queue.enqueue('action', { actionId: 'car_work_day' })
    const seen: string[] = []
    const result = await queue.syncWithServer(async actions => {
      seen.push(...actions.map(action => action.id))
      return { success: true, data: { state: {} as never, applied: actions.length, failed: 0 } }
    })
    expect(seen).toEqual([first.id, second.id])
    expect(result).toMatchObject({ applied: 2, failed: 0, remaining: 0 })
    expect(queue.hasPending()).toBe(false)
  })
})
