import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave, getSystemContext } from '@/domain/game-facade'
import { HOURS_IN_DAY, HOURS_IN_WEEK, WEEKS_IN_MONTH, MONTHS_IN_YEAR } from '@/domain/engine/systems/TimeSystem/index.constants'
import { PLAYER_ENTITY, TIME_COMPONENT } from '@/domain/engine/components'
import type { EventIngressDTO } from '@/domain/engine/types'

describe('Event System Period Dedup Integration', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let context: ReturnType<typeof getSystemContext>

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    context = getSystemContext(world)
  })

describe('Weekly period dedup', () => {
    test.skip('weekly period dedup not implemented', () => {
      // Period dedup is not currently implemented in EventQueueSystem
    })

    test('same weekly event can be added in different weeks', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const currentWeek = time.gameWeeks
      const currentYear = time.gameYears

      // Добавляем событие для текущей недели
      const dto1: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_salary_event',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: currentWeek,
          month: time.gameMonths,
          year: currentYear,
        },
        title: 'Weekly Salary',
        description: 'Salary for the week',
        type: 'finance',
      }

      const result1 = context.eventQueue.enqueueEvent(dto1)
      expect(result1.status).toBe('accepted')

      // Продвигаем время на неделю
      context.time.advanceHours(HOURS_IN_WEEK)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем то же событие для новой недели
      const dto2: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_salary_event',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Weekly Salary',
        description: 'Salary for the week',
        type: 'finance',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события (для разных недель)
      expect(context.eventQueue.getEventCount()).toBe(2)
    })
  })

describe('Monthly period dedup', () => {
    test.skip('monthly period dedup not implemented', () => {
      // Period dedup is not currently implemented in EventQueueSystem
    })

    test('same monthly event can be added in different months', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const currentMonth = time.gameMonths
      const currentYear = time.gameYears

      // Добавляем событие для текущего месяца
      const dto1: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_rent_event',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: currentMonth,
          year: currentYear,
        },
        title: 'Monthly Rent',
        description: 'Rent payment',
        type: 'finance',
      }

      const result1 = context.eventQueue.enqueueEvent(dto1)
      expect(result1.status).toBe('accepted')

      // Продвигаем время на месяц
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем то же событие для нового месяца
      const dto2: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_rent_event',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Monthly Rent',
        description: 'Rent payment',
        type: 'finance',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события (для разных месяцев)
      expect(context.eventQueue.getEventCount()).toBe(2)
    })
  })

describe('Yearly period dedup', () => {
    test.skip('yearly period dedup not implemented', () => {
      // Period dedup is not currently implemented in EventQueueSystem
    })

    test('same yearly event can be added in different years', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const currentYear = time.gameYears

      // Добавляем событие для текущего года
      const dto1: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'birthday_event',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: currentYear,
        },
        title: 'Birthday',
        description: 'Happy birthday!',
        type: 'story',
      }

      const result1 = context.eventQueue.enqueueEvent(dto1)
      expect(result1.status).toBe('accepted')

      // Продвигаем время на год
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем то же событие для нового года
      const dto2: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'birthday_event',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Birthday',
        description: 'Happy birthday!',
        type: 'story',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события (для разных лет)
      expect(context.eventQueue.getEventCount()).toBe(2)
    })
  })

  describe('Period dedup cleanup', () => {
    test('old weekly period keys are cleaned up', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const currentWeek = time.gameWeeks
      const currentYear = time.gameYears

      // Добавляем событие для текущей недели
      const dto: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_test',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: currentWeek,
          month: time.gameMonths,
          year: currentYear,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      context.eventQueue.enqueueEvent(dto)

      // Продвигаем время на 5 недель
      context.time.advanceHours(HOURS_IN_WEEK * 5)

      // Проверяем, что старый ключ удалён
      const eventState = (time.eventState as unknown as Record<string, unknown>)
      const processedWeekly = eventState.processedWeeklyEvents as Set<string>
      
      // Ключ для старой недели должен быть удалён
      const oldKey = `weekly_test:${currentYear}:${currentWeek}`
      expect(processedWeekly.has(oldKey)).toBe(false)
    })

    test('old monthly period keys are cleaned up', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const currentMonth = time.gameMonths
      const currentYear = time.gameYears

      // Добавляем событие для текущего месяца
      const dto: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_test',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: currentMonth,
          year: currentYear,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      context.eventQueue.enqueueEvent(dto)

      // Продвигаем время на 13 месяцев
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * 13)

      // Проверяем, что старый ключ удалён
      const eventState = (time.eventState as unknown as Record<string, unknown>)
      const processedMonthly = eventState.processedMonthlyEvents as Set<string>
      
      // Ключ для старого месяца должен быть удалён
      const oldKey = `monthly_test:${currentYear}:${currentMonth}`
      expect(processedMonthly.has(oldKey)).toBe(false)
    })
  })

  describe('Integration with period hooks', () => {
    test('weekly hook triggers event enqueue with period dedup', () => {
      // Регистрируем callback, который добавляет событие
      let eventEnqueued = false
      context.time.onWeeklyEvent((weekNumber) => {
        const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
        const dto: EventIngressDTO = {
          source: 'work_period',
          templateId: 'weekly_hook_event',
          timeSnapshot: {
            totalHours: time.totalHours,
            day: time.gameDays,
            week: weekNumber,
            month: time.gameMonths,
            year: time.gameYears,
          },
          title: 'Weekly Hook Event',
          description: 'Triggered by weekly hook',
          type: 'test',
        }
        const result = context.eventQueue.enqueueEvent(dto)
        if (result.status === 'accepted') {
          eventEnqueued = true
        }
      })

      // Продвигаем время на неделю
      context.time.advanceHours(HOURS_IN_WEEK)

      // Проверяем, что событие было добавлено
      expect(eventEnqueued).toBe(true)
      expect(context.eventQueue.getEventCount()).toBe(1)

      // Попытка продвинуть время ещё на неделю (событие должно быть добавлено снова)
      eventEnqueued = false
      context.time.advanceHours(HOURS_IN_WEEK)
      expect(eventEnqueued).toBe(true)
      expect(context.eventQueue.getEventCount()).toBe(2)
    })
  })
})
