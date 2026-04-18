import { describe, expect, test, beforeEach, vi } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { TimeSystem } from '@/domain/engine/systems/TimeSystem'
import { PLAYER_ENTITY, TIME_COMPONENT } from '@/domain/engine/components'
import { HOURS_IN_DAY, HOURS_IN_WEEK, WEEKS_IN_MONTH, MONTHS_IN_YEAR, DAYS_IN_AGE_YEAR } from '@/domain/engine/systems/TimeSystem/index.constants'

describe('TimeSystem', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let timeSystem: TimeSystem

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    timeSystem = new TimeSystem()
    timeSystem.init(world)
  })

  describe('initialization', () => {
    test('initializes with zero time', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(0)
      expect(time.gameDays).toBe(0)
      expect(time.gameWeeks).toBe(1)
      expect(time.gameMonths).toBe(1)
      expect(time.currentAge).toBe(18)
    })

    test('normalizes legacy gameDays to totalHours', () => {
      const world2 = createWorldFromSave({ 
        playerName: 'Tester',
        player: {
          time: {
            gameDays: 5,
            totalHours: undefined
          }
        }
      })
      const ts = new TimeSystem()
      ts.init(world2)
      const time = world2.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(5 * HOURS_IN_DAY)
    })
  })

  describe('advanceHours - basic functionality', () => {
    test('advances time by specified hours', () => {
      const result = timeSystem.advanceHours(5)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(5)
      expect(time.hourOfDay).toBe(5)
      expect(time.dayHoursSpent).toBe(5)
      expect(time.dayHoursRemaining).toBe(HOURS_IN_DAY - 5)
    })

    test('handles zero hours gracefully', () => {
      const result = timeSystem.advanceHours(0)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(0)
      expect(result.weekly).toEqual([])
      expect(result.monthly).toEqual([])
      expect(result.yearly).toEqual([])
    })

    test('handles negative hours gracefully', () => {
      const result = timeSystem.advanceHours(-5)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(0)
    })
  })

  describe('day rollover', () => {
    test('triggers day rollover at 24 hours', () => {
      timeSystem.advanceHours(24)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameDays).toBe(1)
      expect(time.hourOfDay).toBe(0)
      expect(time.dayOfWeek).toBe(1)
    })

    test('handles partial day after rollover', () => {
      timeSystem.advanceHours(30)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameDays).toBe(1)
      expect(time.hourOfDay).toBe(6)
      expect(time.dayOfWeek).toBe(1)
    })

    test('resets sleep hours on day rollover', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      time.sleepHoursToday = 5
      time.sleepDebt = 2
      
      timeSystem.advanceHours(24)
      
      expect(time.sleepHoursToday).toBe(0)
      expect(time.sleepDebt).toBeGreaterThan(2) // debt increased due to < 7h sleep
    })
  })

  describe('week rollover', () => {
    test('triggers weekly callback at week boundary', () => {
      const weeklyCallback = vi.fn()
      timeSystem.onWeeklyEvent(weeklyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK)
      
      expect(weeklyCallback).toHaveBeenCalledWith(2)
    })

    test('handles multiple week rollovers', () => {
      const weeklyCallback = vi.fn()
      timeSystem.onWeeklyEvent(weeklyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * 3)
      
      expect(weeklyCallback).toHaveBeenCalledTimes(3)
      expect(weeklyCallback).toHaveBeenNthCalledWith(1, 2)
      expect(weeklyCallback).toHaveBeenNthCalledWith(2, 3)
      expect(weeklyCallback).toHaveBeenNthCalledWith(3, 4)
    })

    test('updates week hours correctly', () => {
      timeSystem.advanceHours(HOURS_IN_WEEK - 10)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.weekHoursRemaining).toBe(10)
      
      timeSystem.advanceHours(10)
      expect(time.weekHoursRemaining).toBe(HOURS_IN_WEEK)
    })
  })

  describe('month rollover', () => {
    test('triggers monthly callback at month boundary', () => {
      const monthlyCallback = vi.fn()
      timeSystem.onMonthlyEvent(monthlyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      
      expect(monthlyCallback).toHaveBeenCalledWith(2)
    })

    test('handles multiple month rollovers', () => {
      const monthlyCallback = vi.fn()
      timeSystem.onMonthlyEvent(monthlyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * 3)
      
      expect(monthlyCallback).toHaveBeenCalledTimes(3)
    })

    test('calculates year correctly from months', () => {
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameMonths).toBe(MONTHS_IN_YEAR + 1)
      expect(time.gameYears).toBe(2.0)
    })
  })

  describe('year rollover', () => {
    test('triggers yearly callback at year boundary', () => {
      const yearlyCallback = vi.fn()
      timeSystem.onYearlyEvent(yearlyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      
      expect(yearlyCallback).toHaveBeenCalledWith(2)
    })

    test('handles multiple year rollovers', () => {
      const yearlyCallback = vi.fn()
      timeSystem.onYearlyEvent(yearlyCallback)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR * 2)
      
      expect(yearlyCallback).toHaveBeenCalledTimes(2)
    })
  })

  describe('age rollover', () => {
    test('triggers age callback at age boundary', () => {
      const ageCallback = vi.fn()
      timeSystem.onAgeEvent(ageCallback)
      
      timeSystem.advanceHours(HOURS_IN_DAY * DAYS_IN_AGE_YEAR)
      
      expect(ageCallback).toHaveBeenCalledWith(18, 19)
    })

    test('updates currentAge correctly', () => {
      timeSystem.advanceHours(HOURS_IN_DAY * DAYS_IN_AGE_YEAR)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.currentAge).toBe(19)
    })

    test('handles multiple age rollovers', () => {
      const ageCallback = vi.fn()
      timeSystem.onAgeEvent(ageCallback)
      
      timeSystem.advanceHours(HOURS_IN_DAY * DAYS_IN_AGE_YEAR * 3)
      
      expect(ageCallback).toHaveBeenCalledTimes(3)
      expect(ageCallback).toHaveBeenNthCalledWith(1, 18, 19)
      expect(ageCallback).toHaveBeenNthCalledWith(2, 19, 20)
      expect(ageCallback).toHaveBeenNthCalledWith(3, 20, 21)
    })
  })

  describe('large jumps', () => {
    test('handles large hour jump (1000 hours)', () => {
      const weeklyCallback = vi.fn()
      const monthlyCallback = vi.fn()
      timeSystem.onWeeklyEvent(weeklyCallback)
      timeSystem.onMonthlyEvent(monthlyCallback)
      
      timeSystem.advanceHours(1000)
      
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(1000)
      expect(weeklyCallback).toHaveBeenCalled()
      expect(monthlyCallback).toHaveBeenCalled()
    })

    test('handles very large jump (10000 hours)', () => {
      const weeklyCallback = vi.fn()
      const monthlyCallback = vi.fn()
      const yearlyCallback = vi.fn()
      timeSystem.onWeeklyEvent(weeklyCallback)
      timeSystem.onMonthlyEvent(monthlyCallback)
      timeSystem.onYearlyEvent(yearlyCallback)
      
      timeSystem.advanceHours(10000)
      
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(10000)
      expect(weeklyCallback).toHaveBeenCalled()
      expect(monthlyCallback).toHaveBeenCalled()
      expect(yearlyCallback).toHaveBeenCalled()
    })

    test('maintains consistency after large jump', () => {
      timeSystem.advanceHours(5000)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      
      // Verify derived fields are consistent
      const expectedDays = Math.floor(time.totalHours / HOURS_IN_DAY)
      const expectedWeeks = Math.floor(time.totalHours / HOURS_IN_WEEK) + 1
      const expectedMonths = Math.floor(expectedWeeks / WEEKS_IN_MONTH) + 1
      
      expect(time.gameDays).toBe(expectedDays)
      expect(time.gameWeeks).toBe(expectedWeeks)
      expect(time.gameMonths).toBe(expectedMonths)
    })
  })

  describe('sleep mechanics', () => {
    test('tracks sleep hours correctly', () => {
      timeSystem.advanceHours(8, { sleepHours: 8 })
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.sleepHoursToday).toBe(8)
    })

    test('accumulates sleep debt when sleeping less than 7 hours', () => {
      timeSystem.advanceHours(24, { sleepHours: 5 })
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.sleepDebt).toBeGreaterThan(0)
    })

    test('reduces sleep debt when sleeping more than 7 hours', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      time.sleepDebt = 10
      
      timeSystem.advanceHours(24, { sleepHours: 9 })
      
      expect(time.sleepDebt).toBeLessThan(10)
    })

    test('caps sleep hours at 24', () => {
      timeSystem.advanceHours(24, { sleepHours: 30 })
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.sleepHoursToday).toBe(24)
    })
  })

  describe('periodic callback management', () => {
    test('allows registering multiple weekly callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      timeSystem.onWeeklyEvent(callback1)
      timeSystem.onWeeklyEvent(callback2)
      
      timeSystem.advanceHours(HOURS_IN_WEEK)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('allows registering multiple monthly callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      timeSystem.onMonthlyEvent(callback1)
      timeSystem.onMonthlyEvent(callback2)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('allows registering multiple yearly callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      timeSystem.onYearlyEvent(callback1)
      timeSystem.onYearlyEvent(callback2)
      
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    test('allows registering multiple age callbacks', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      timeSystem.onAgeEvent(callback1)
      timeSystem.onAgeEvent(callback2)
      
      timeSystem.advanceHours(HOURS_IN_DAY * DAYS_IN_AGE_YEAR)
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    test('handles exactly 24 hours', () => {
      timeSystem.advanceHours(24)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameDays).toBe(1)
      expect(time.hourOfDay).toBe(0)
    })

    test('handles exactly 168 hours (1 week)', () => {
      timeSystem.advanceHours(HOURS_IN_WEEK)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameWeeks).toBe(2)
      expect(time.weekHoursRemaining).toBe(HOURS_IN_WEEK)
    })

    test('handles exactly 672 hours (1 month)', () => {
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameMonths).toBe(2)
    })

    test('handles exactly 8064 hours (1 year)', () => {
      timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.gameYears).toBe(2.0)
    })

    test('handles fractional hours by flooring', () => {
      timeSystem.advanceHours(5.7)
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(5)
    })
  })

  describe('getter methods', () => {
    test('getTotalHours returns correct value', () => {
      timeSystem.advanceHours(42)
      expect(timeSystem.getTotalHours()).toBe(42)
    })

    test('getDayHoursRemaining returns correct value', () => {
      timeSystem.advanceHours(10)
      expect(timeSystem.getDayHoursRemaining()).toBe(HOURS_IN_DAY - 10)
    })

    test('getWeekHoursRemaining returns correct value', () => {
      timeSystem.advanceHours(50)
      expect(timeSystem.getWeekHoursRemaining()).toBe(HOURS_IN_WEEK - 50)
    })

    test('getters return 0 when time component is missing', () => {
      world.removeComponent(PLAYER_ENTITY, TIME_COMPONENT)
      expect(timeSystem.getTotalHours()).toBe(0)
      expect(timeSystem.getDayHoursRemaining()).toBe(0)
      expect(timeSystem.getWeekHoursRemaining()).toBe(0)
    })
  })

  describe('advanceHours return value', () => {
    test('returns empty result when no periods crossed', () => {
      const result = timeSystem.advanceHours(5)
      expect(result.weekly).toEqual([])
      expect(result.monthly).toEqual([])
      expect(result.yearly).toEqual([])
      expect(result.age).toEqual([])
    })

    test('returns weekly events when week crossed', () => {
      const result = timeSystem.advanceHours(HOURS_IN_WEEK)
      expect(result.weekly).toEqual([2])
      expect(result.monthly).toEqual([])
      expect(result.yearly).toEqual([])
    })

    test('returns monthly events when month crossed', () => {
      const result = timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      expect(result.weekly).toHaveLength(WEEKS_IN_MONTH)
      expect(result.monthly).toEqual([2])
      expect(result.yearly).toEqual([])
    })

    test('returns yearly events when year crossed', () => {
      const result = timeSystem.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      expect(result.weekly).toHaveLength(MONTHS_IN_YEAR * WEEKS_IN_MONTH)
      expect(result.monthly).toHaveLength(MONTHS_IN_YEAR)
      expect(result.yearly).toEqual([2])
    })
  })
})
