import type { ApiResponse, SyncResponse } from '@game-life/contracts'
import type { DayEndHooks } from '@/domain/game-world/commands'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { advanceHours } from '@/domain/game-world/commands'
import { createServerExecutor } from '@/application/game/server-executor'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

const fetchMock: Mock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)

describe('server executor day plan', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('reports failed remote steps and still closes remaining day', async () => {
    const before: GameWorld = GameWorld.createEmpty()
    const afterIdle: GameWorld = GameWorld.fromJSON(before.toJSON())
    advanceHours(afterIdle, 24, 'idle')
    let syncCalls: number = 0

    fetchMock.mockImplementation(async (url: string, options?: { body?: Record<string, unknown> }) => {
      if (url.endsWith('/api/game/state')) {
        return {
          success: true,
          data: { state: before.toJSON(), stateVersion: 0 },
        } as ApiResponse<{ state: GameWorldJSON; stateVersion: number }>
      }

      syncCalls++
      if (syncCalls === 1) throw new Error('temporary network failure')

      const body: Record<string, unknown> = options?.body ?? {}
      expect(body.actions).toBeDefined()
      return {
        success: true,
        data: {
          state: afterIdle.toJSON(),
          stateVersion: 1,
          applied: 1,
          failed: 0,
        },
      } as ApiResponse<SyncResponse<GameWorldJSON>>
    })

    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }
    const result = await createServerExecutor({ baseUrl: '', dayEndHooks: hooks }).planDay(null, {
      sleepHours: 7,
      actionIds: [],
    })

    expect(syncCalls).toBe(2)
    expect(result.success).toBe(true)
    expect(result.steps).toMatchObject([
      { kind: 'sleep', success: false, hoursSpent: 0 },
      { kind: 'idle', success: true, hoursSpent: 24 },
    ])
    expect(result.totalHoursSpent).toBe(24)
    expect(hooks.onDayEnd).toHaveBeenCalledOnce()
  })
})
