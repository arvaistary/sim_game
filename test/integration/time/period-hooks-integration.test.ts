import { describe, expect, test, beforeEach, vi } from 'vitest'
import { createWorldFromSave, getSystemContext } from '@/domain/game-facade'
import { HOURS_IN_DAY, HOURS_IN_WEEK, WEEKS_IN_MONTH, MONTHS_IN_YEAR } from '@/domain/engine/systems/TimeSystem/index.constants'
import { PLAYER_ENTITY, WALLET_COMPONENT, WORK_COMPONENT, TIME_COMPONENT } from '@/domain/engine/components'

describe('Period Hooks Integration', () => {
  describe('advanceHours -> period hooks -> systems chain', () => {
    let world: ReturnType<typeof createWorldFromSave>
    let context: ReturnType<typeof getSystemContext>

    beforeEach(() => {
      world = createWorldFromSave({ playerName: 'Tester' })
      context = getSystemContext(world)
    })

    test('weekly hook triggers WorkPeriodSystem.handleWeekRollover', () => {
      // Setup: add work component
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
        work.pendingSalaryWeek = 0
      }

      // Spy on handleWeekRollover
      const spy = vi.spyOn(context.workPeriod, 'handleWeekRollover')

      // Advance time by exactly one week
      const result = context.time.advanceHours(HOURS_IN_WEEK)

      // Verify weekly hook was triggered
      expect(result.weekly).toContain(2)
      expect(spy).toHaveBeenCalledWith(2)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    test('monthly hook triggers MonthlySettlementSystem.applyMonthlySettlement', () => {
      // Setup: add wallet with money
      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = 10000
      }

      // Spy on applyMonthlySettlement
      const spy = vi.spyOn(context.monthlySettlement, 'applyMonthlySettlement')

      // Advance time by exactly one month
      const result = context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)

      // Verify monthly hook was triggered
      expect(result.monthly).toContain(2)
      expect(spy).toHaveBeenCalledWith(2)
      expect(spy).toHaveBeenCalledTimes(1)
    })

    test('multiple weeks trigger multiple weekly hooks', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      const spy = vi.spyOn(context.workPeriod, 'handleWeekRollover')

      // Advance time by 3 weeks
      const result = context.time.advanceHours(HOURS_IN_WEEK * 3)

      // Verify all weekly hooks were triggered
      expect(result.weekly).toEqual([2, 3, 4])
      expect(spy).toHaveBeenCalledTimes(3)
      expect(spy).toHaveBeenNthCalledWith(1, 2)
      expect(spy).toHaveBeenNthCalledWith(2, 3)
      expect(spy).toHaveBeenNthCalledWith(3, 4)
    })

    test('multiple months trigger multiple monthly hooks', () => {
      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = 50000
      }

      const spy = vi.spyOn(context.monthlySettlement, 'applyMonthlySettlement')

      // Advance time by 3 months
      const result = context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * 3)

      // Verify all monthly hooks were triggered
      expect(result.monthly).toEqual([2, 3, 4])
      expect(spy).toHaveBeenCalledTimes(3)
    })

    test('weekly and monthly hooks trigger correctly in sequence', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = 20000
      }

      const weeklySpy = vi.spyOn(context.workPeriod, 'handleWeekRollover')
      const monthlySpy = vi.spyOn(context.monthlySettlement, 'applyMonthlySettlement')

      // Advance time by 1 month (4 weeks)
      const result = context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)

      // Verify both hooks triggered
      expect(result.weekly).toHaveLength(WEEKS_IN_MONTH)
      expect(result.monthly).toHaveLength(1)
      expect(weeklySpy).toHaveBeenCalledTimes(WEEKS_IN_MONTH)
      expect(monthlySpy).toHaveBeenCalledTimes(1)
    })

    test('large jump triggers all period hooks correctly', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = 100000
      }

      const weeklySpy = vi.spyOn(context.workPeriod, 'handleWeekRollover')
      const monthlySpy = vi.spyOn(context.monthlySettlement, 'applyMonthlySettlement')
      const yearlySpy = vi.spyOn(context.time, 'onYearlyEvent')

      // Register a yearly callback
      const yearlyCallback = vi.fn()
      context.time.onYearlyEvent(yearlyCallback)

      // Advance time by 1 year
      const result = context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)

      // Verify all hooks triggered
      expect(result.weekly).toHaveLength(MONTHS_IN_YEAR * WEEKS_IN_MONTH)
      expect(result.monthly).toHaveLength(MONTHS_IN_YEAR)
      expect(result.yearly).toHaveLength(1)
      expect(weeklySpy).toHaveBeenCalledTimes(MONTHS_IN_YEAR * WEEKS_IN_MONTH)
      expect(monthlySpy).toHaveBeenCalledTimes(MONTHS_IN_YEAR)
      expect(yearlyCallback).toHaveBeenCalledTimes(1)
    })

    test('period hooks maintain world state consistency', () => {
      const initialMoney = 10000
      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = initialMoney
      }

      // Advance time by 1 month
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)

      // Verify time component is consistent
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      expect(time.gameMonths).toBe(2)
      expect(time.gameWeeks).toBe(WEEKS_IN_MONTH + 1)

      // Verify wallet still exists and is valid
      const finalWallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      expect(finalWallet).toBeDefined()
      expect(typeof finalWallet.money).toBe('number')
    })

    test('period hooks do not interfere with each other', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = 20000
      }

      // Track call order
      const callOrder: string[] = []
      
      const originalWeekly = context.workPeriod.handleWeekRollover.bind(context.workPeriod)
      context.workPeriod.handleWeekRollover = vi.fn((week: number) => {
        callOrder.push(`weekly_${week}`)
        return originalWeekly(week)
      })

      const originalMonthly = context.monthlySettlement.applyMonthlySettlement.bind(context.monthlySettlement)
      context.monthlySettlement.applyMonthlySettlement = vi.fn((month: number) => {
        callOrder.push(`monthly_${month}`)
        return originalMonthly(month)
      })

      // Advance time by 1 month
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)

      // Verify all weekly hooks called before monthly
      const weeklyCalls = callOrder.filter(c => c.startsWith('weekly_'))
      const monthlyCalls = callOrder.filter(c => c.startsWith('monthly_'))
      
      expect(weeklyCalls).toHaveLength(WEEKS_IN_MONTH)
      expect(monthlyCalls).toHaveLength(1)
      
      // All weekly calls should come before monthly
      const lastWeeklyIndex = callOrder.lastIndexOf(weeklyCalls[weeklyCalls.length - 1])
      const firstMonthlyIndex = callOrder.indexOf(monthlyCalls[0])
      expect(lastWeeklyIndex).toBeLessThan(firstMonthlyIndex)
    })

    test('period hooks handle errors gracefully', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      // Make weekly hook throw an error
      const originalWeekly = context.workPeriod.handleWeekRollover.bind(context.workPeriod)
      context.workPeriod.handleWeekRollover = vi.fn(() => {
        throw new Error('Test error in weekly hook')
      })

      // This should not crash the entire time advance
      expect(() => {
        context.time.advanceHours(HOURS_IN_WEEK)
      }).not.toThrow()

      // Time should still advance
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as any
      expect(time.totalHours).toBe(HOURS_IN_WEEK)
    })

    test('custom period callbacks are triggered', () => {
      const customWeeklyCallback = vi.fn()
      const customMonthlyCallback = vi.fn()
      const customYearlyCallback = vi.fn()

      context.time.onWeeklyEvent(customWeeklyCallback)
      context.time.onMonthlyEvent(customMonthlyCallback)
      context.time.onYearlyEvent(customYearlyCallback)

      // Advance time by 1 year
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)

      expect(customWeeklyCallback).toHaveBeenCalledTimes(MONTHS_IN_YEAR * WEEKS_IN_MONTH)
      expect(customMonthlyCallback).toHaveBeenCalledTimes(MONTHS_IN_YEAR)
      expect(customYearlyCallback).toHaveBeenCalledTimes(1)
    })

    test('period hooks work with partial week advances', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
      }

      const spy = vi.spyOn(context.workPeriod, 'handleWeekRollover')

      // Advance by 3 days (no week rollover)
      context.time.advanceHours(HOURS_IN_DAY * 3)
      expect(spy).not.toHaveBeenCalled()

      // Advance by remaining 4 days (week rollover)
      context.time.advanceHours(HOURS_IN_DAY * 4)
      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(2)
    })
  })

  describe('period hooks with real game state', () => {
    let world: ReturnType<typeof createWorldFromSave>
    let context: ReturnType<typeof getSystemContext>

    beforeEach(() => {
      world = createWorldFromSave({ playerName: 'Tester' })
      context = getSystemContext(world)
    })

    test('monthly settlement reduces wallet money', () => {
      const initialMoney = 15000
      const wallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      if (wallet) {
        wallet.money = initialMoney
      }

      // Advance by 1 month
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)

      // Money should be reduced by monthly expenses
      const finalWallet = world.getComponent(PLAYER_ENTITY, WALLET_COMPONENT) as any
      expect(finalWallet.money).toBeLessThan(initialMoney)
    })

    test('work period rollover resets weekly work hours', () => {
      const work = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      if (work) {
        work.id = 'test_job'
        work.employed = true
        work.requiredHoursPerWeek = 40
        work.workedHoursCurrentWeek = 35
        work.pendingSalaryWeek = 5000
      }

      // Advance by 1 week
      context.time.advanceHours(HOURS_IN_WEEK)

      // Weekly work hours should be reset
      const finalWork = world.getComponent(PLAYER_ENTITY, WORK_COMPONENT) as any
      expect(finalWork.workedHoursCurrentWeek).toBe(0)
    })
  })
})
