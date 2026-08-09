import type { ApiResponse, SyncResponse } from '@game-life/contracts'
import type { DayEndHooks, DayPlanResult } from '@/domain/game-world/commands'
import { createLiveDayEndHooks, advanceHours  } from '@/domain/game-world/commands'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'

import { createServerExecutor } from '@/application/game/server-executor'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import { createFakeRandomSource } from '../../domain/game-world/__fixtures__/fake-random-source'

const fetchMock: Mock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)

function employedWorld(totalHours: number = 0): GameWorld {
  return GameWorld.createEmpty({
    time: {
      totalHours,
      hourOfDay: totalHours % 24,
      dayOfWeek: 1,
      weekHoursSpent: totalHours % 168,
      weekHoursRemaining: 168 - (totalHours % 168),
      dayHoursSpent: totalHours % 24,
      dayHoursRemaining: 24 - (totalHours % 24),
      sleepHoursToday: 0,
      sleepDebt: 0,
    },
    wallet: { money: 1_000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    career: {
      currentJob: {
        id: 'job',
        name: 'Job',
        schedule: '5/2',
        employed: true,
        salaryPerHour: 10,
        salaryPerWeek: 400,
        salaryPerDay: 80,
        requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 0,
        pendingSalaryWeek: 0,
        totalWorkedHours: 0,
        level: 1,
        daysAtWork: 0,
      },
      jobHistory: [],
      careerLevel: 1,
      promotions: 0,
    },
  })
}

function successSyncResponse(state: GameWorldJSON, stateVersion: number): ApiResponse<SyncResponse<GameWorldJSON>> {
  return {
    success: true,
    data: {
      state,
      stateVersion,
      applied: 1,
      failed: 0,
    },
  }
}

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
      return successSyncResponse(afterIdle.toJSON(), syncCalls)
    })

    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }
    const result: DayPlanResult = await createServerExecutor({ baseUrl: '', dayEndHooks: hooks }).planDay(null, {
      sleepHours: 7,
      actionIds: [],
    })

    expect(syncCalls).toBe(3)
    expect(result.success).toBe(true)
    expect(result.steps).toMatchObject([
      { kind: 'sleep', success: false, hoursSpent: 0 },
      { kind: 'idle', success: true, hoursSpent: 24 },
    ])
    expect(result.totalHoursSpent).toBe(24)
    expect(hooks.onDayEnd).toHaveBeenCalledOnce()
    expect(hooks.onDayEnd).toHaveBeenCalledWith(expect.any(GameWorld), result)
  })

  it('passes age context after server-side year boundary', async () => {
    const before: GameWorld = GameWorld.createEmpty()
    advanceHours(before, 364 * 24, 'idle')
    const afterIdle: GameWorld = GameWorld.fromJSON(before.toJSON())
    advanceHours(afterIdle, 24, 'idle')
    afterIdle.player.currentAge = 19
    let syncCalls: number = 0

    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith('/api/game/state')) {
        return { success: true, data: { state: before.toJSON(), stateVersion: 0 } }
      }

      syncCalls++

      if (syncCalls === 1) throw new Error('skip sleep')

      return successSyncResponse(afterIdle.toJSON(), syncCalls)
    })

    const hooks: DayEndHooks = {
      onDayEnd: vi.fn(), onWeekEnd: vi.fn(), onMonthEnd: vi.fn(), onYearEnd: vi.fn(), onAgeChanged: vi.fn(),
    }

    await createServerExecutor({ baseUrl: '', dayEndHooks: hooks }).planDay(null, { sleepHours: 7, actionIds: [] })

    expect(hooks.onYearEnd).toHaveBeenCalledOnce()
    expect(hooks.onAgeChanged).toHaveBeenCalledWith(expect.any(GameWorld), { previousAge: 18, currentAge: 19 })
    expect(syncCalls).toBe(3)
  })

  it('T048 persists live day-end hook effects through day_end_hooks sync', async () => {
    const before: GameWorld = employedWorld()
    const afterPlan: GameWorld = GameWorld.fromJSON(before.toJSON())
    advanceHours(afterPlan, 24, 'idle')
    let syncCalls: number = 0
    let hooksPayload: Record<string, unknown> | undefined
    let hooksCommandId: string | undefined

    fetchMock.mockImplementation(async (url: string, options?: { body?: Record<string, unknown> }) => {
      if (url.endsWith('/api/game/state')) {
        return {
          success: true,
          data: { state: before.toJSON(), stateVersion: 0 },
        } as ApiResponse<{ state: GameWorldJSON; stateVersion: number }>
      }

      syncCalls++
      const body: Record<string, unknown> = options?.body ?? {}
      const actions: Array<Record<string, unknown>> = body.actions as Array<Record<string, unknown>>
      const action: Record<string, unknown> | undefined = actions[0]

      if (action?.type === 'day_end_hooks') {
        hooksPayload = action.payload as Record<string, unknown>
        hooksCommandId = action.commandId as string
        const merged: GameWorld = GameWorld.fromJSON(afterPlan.toJSON())
        merged.events.pending = (hooksPayload.events as GameWorldJSON['events']).pending
        merged.events.state = (hooksPayload.events as GameWorldJSON['events']).state

        return successSyncResponse(merged.toJSON(), syncCalls)
      }

      return successSyncResponse(afterPlan.toJSON(), syncCalls)
    })

    const hooks: DayEndHooks = createLiveDayEndHooks(createFakeRandomSource([0]))
    const result: DayPlanResult = await createServerExecutor({ baseUrl: '', dayEndHooks: hooks }).planDay(null, {
      sleepHours: 7,
      workHours: 8,
      actionIds: [],
    })

    expect(result.success).toBe(true)
    expect(syncCalls).toBe(3)
    expect(hooksPayload).toBeDefined()
    expect((hooksPayload?.events as GameWorldJSON['events']).pending.length).toBeGreaterThan(0)
    expect(hooksPayload?.dayNumber).toBe(1)
    expect(hooksCommandId).toBe('day_end_hooks_1')
  })
})
