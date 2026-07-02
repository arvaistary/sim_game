/**
 * Тесты для state-sync и error-handler (Stage 5.3-5.4).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import {
  loadWorldFromServer,
  initServerWorld,
  checkConflict,
} from '@/application/game/state-sync'
import {
  parseApiError,
  isNetworkError,
  isValidationError,
  isSessionError,
} from '@/application/game/error-handler'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { ConflictInfo, NuxtLikeError, ParsedApiError } from '@/application/game/server-sync.types'

// Mock $fetch (Nuxt auto-import)
const fetchMock: Mock = vi.fn()

vi.stubGlobal('$fetch', fetchMock)

describe('state-sync', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('loadWorldFromServer: возвращает state при success', async () => {
    const mockState: GameWorldJSON = {
      version: 1,
      player: { playerName: 'Test', startAge: 18, currentAge: 18 },
      time: {
        totalHours: 0,
        hourOfDay: 0,
        dayOfWeek: 1,
        weekHoursSpent: 0,
        weekHoursRemaining: 168,
        dayHoursSpent: 0,
        dayHoursRemaining: 24,
        sleepHoursToday: 0,
        sleepDebt: 0,
      },
      stats: { hunger: 70, energy: 70, stress: 30, mood: 60, health: 80, physical: 50 },
      wallet: { money: 0, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
      career: {
        currentJob: {
          id: 'unemployed',
          name: 'Безработный',
          schedule: '0/0',
          employed: false,
          salaryPerHour: 0,
          salaryWeek: 0,
          salaryPerDay: 0,
          salaryPerWeek: 0,
          requiredHoursPerWeek: 0,
          workedHoursCurrentWeek: 0,
          pendingSalaryWeek: 0,
          totalWorkedHours: 0,
          level: 0,
          daysAtWork: 0,
        },
        jobHistory: [],
        careerLevel: 0,
        promotions: 0,
      },
      housing: {
        level: 0,
        name: 'Нет жилья',
        comfort: 0,
        furniture: [],
        lastWeeklyBonus: null,
      },
      skills: { levels: {}, modifiers: { stress: 0, money: 0, work: 0, learn: 0, social: 0 } },
      education: {
        school: 'none',
        institute: 'none',
        educationLevel: 'Нет',
        activeCourses: [],
        completedPrograms: [],
      },
      relationships: [],
      finance: {
        reserveFund: 0,
        monthlyExpenses: {},
        lastMonthlySettlement: null,
        debt: 0,
        investments: [],
        expenseList: [],
      },
      events: {
        state: {
          cooldownByEventId: {},
          lastWeeklyEventWeek: 0,
          lastMonthlyEventMonth: 0,
          lastYearlyEventYear: 0,
          seenEventIds: [],
        },
        history: [],
        pending: [],
      },
      activity: {
        entries: [],
        lifetime: { totalWorkDays: 0, totalWorkHours: 0, totalEvents: 0, totalMicroEvents: 0, maxMoney: 0 },
      },
      tags: { items: [] },
    }

    fetchMock.mockResolvedValue({
      success: true,
      data: { state: mockState, sessionId: 's1', version: '1.0' },
      timestamp: Date.now(),
    })

    const state: GameWorldJSON = await loadWorldFromServer('')
    expect(state.player.playerName).toBe('Test')
  })

  it('loadWorldFromServer: бросает при !success', async () => {
    fetchMock.mockResolvedValue({
      success: false,
      error: { code: 'session_not_found', message: 'no session' },
      timestamp: Date.now(),
    })

    await expect(loadWorldFromServer('')).rejects.toThrow('no session')
  })

  it('initServerWorld: POST /api/game/init', async () => {
    fetchMock.mockResolvedValue({
      success: true,
      data: { state: { version: 1 }, sessionId: 's2', version: '1.0' },
      timestamp: Date.now(),
    })

    const state: unknown = await initServerWorld('')
    expect(state).toBeDefined()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/game/init'), expect.any(Object))
  })

  it('checkConflict: detect local ahead of server', () => {
    const localState: GameWorldJSON = { time: { totalHours: 100 } } as unknown as GameWorldJSON
    const serverState: GameWorldJSON = { time: { totalHours: 50 } } as unknown as GameWorldJSON
    const result: ConflictInfo = checkConflict(localState, serverState)

    expect(result.hasConflict).toBe(true)
  })

  it('checkConflict: no conflict when in sync', () => {
    const localState: GameWorldJSON = { time: { totalHours: 100 } } as unknown as GameWorldJSON
    const serverState: GameWorldJSON = { time: { totalHours: 100 } } as unknown as GameWorldJSON
    const result: ConflictInfo = checkConflict(localState, serverState)

    expect(result.hasConflict).toBe(false)
  })
})

describe('error-handler', () => {
  it('parseApiError: network error', () => {
    const parsed: ParsedApiError = parseApiError(new Error('Failed to fetch'))

    expect(parsed.code).toBe('network_error')
    expect(parsed.isNetwork).toBe(true)
    expect(parsed.retryable).toBe(true)
  })

  it('parseApiError: validation error via statusCode', () => {
    const error: NuxtLikeError = { statusCode: 400, message: 'bad input' }
    const parsed: ParsedApiError = parseApiError(error)

    expect(parsed.code).toBe('validation_error')
    expect(parsed.isValidation).toBe(true)
  })

  it('parseApiError: session expired via statusCode 404 + session', () => {
    const error: NuxtLikeError = {
      statusCode: 404,
      message: 'Session not found',
    }
    const parsed: ParsedApiError = parseApiError(error)

    expect(parsed.code).toBe('session_not_found')
    expect(parsed.isSession).toBe(true)
  })

  it('isNetworkError: true for fetch errors', () => {
    expect(isNetworkError(new Error('NetworkError'))).toBe(true)
    expect(isNetworkError(new Error('some other'))).toBe(false)
  })

  it('isValidationError: true for validation errors', () => {
    const error: NuxtLikeError = { statusCode: 400, message: 'invalid' }
    expect(isValidationError(error)).toBe(true)
  })

  it('isSessionError: true for session errors', () => {
    const error: NuxtLikeError = {
      statusCode: 404,
      message: 'Session expired',
    }
    expect(isSessionError(error)).toBe(true)
  })
})
