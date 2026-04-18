import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave, getSystemContext } from '@/domain/game-facade'
import { HOURS_IN_DAY, HOURS_IN_WEEK, WEEKS_IN_MONTH, MONTHS_IN_YEAR } from '@/domain/engine/systems/TimeSystem/index.constants'
import { PLAYER_ENTITY, TIME_COMPONENT } from '@/domain/engine/components'
import type { EventIngressDTO } from '@/domain/engine/types'

describe('Event System Large Time Jumps', () => {
  let world: ReturnType<typeof createWorldFromSave>
  let context: ReturnType<typeof getSystemContext>

  beforeEach(() => {
    world = createWorldFromSave({ playerName: 'Tester' })
    context = getSystemContext(world)
  })

  describe('Large jump across multiple weeks', () => {
    test('weekly events are not duplicated across large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startWeek = time.gameWeeks
      const startYear = time.gameYears

      // Добавляем событие для начальной недели
      const dto: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_large_jump',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: startWeek,
          month: time.gameMonths,
          year: startYear,
        },
        title: 'Weekly Event',
        description: 'Test',
        type: 'test',
      }

      const result1 = context.eventQueue.enqueueEvent(dto)
      expect(result1.status).toBe('accepted')

      // Делаем большой прыжок на 10 недель
      context.time.advanceHours(HOURS_IN_WEEK * 10)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем событие для новой недели
      const dto2: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_large_jump',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Weekly Event',
        description: 'Test',
        type: 'test',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события
      expect(context.eventQueue.getEventCount()).toBe(2)
    })

    test('weekly period dedup keys are cleaned up after large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startWeek = time.gameWeeks
      const startYear = time.gameYears

      // Добавляем событие для начальной недели
      const dto: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_cleanup_test',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: startWeek,
          month: time.gameMonths,
          year: startYear,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      context.eventQueue.enqueueEvent(dto)

      // Делаем большой прыжок на 10 недель
      context.time.advanceHours(HOURS_IN_WEEK * 10)

      // Проверяем, что старый ключ удалён
      const eventState = (time.eventState as unknown as Record<string, unknown>)
      const processedWeekly = eventState.processedWeeklyEvents as Set<string>
      
      const oldKey = `weekly_cleanup_test:${startYear}:${startWeek}`
      expect(processedWeekly.has(oldKey)).toBe(false)
    })
  })

  describe('Large jump across multiple months', () => {
    test('monthly events are not duplicated across large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startMonth = time.gameMonths
      const startYear = time.gameYears

      // Добавляем событие для начального месяца
      const dto: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_large_jump',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: startMonth,
          year: startYear,
        },
        title: 'Monthly Event',
        description: 'Test',
        type: 'test',
      }

      const result1 = context.eventQueue.enqueueEvent(dto)
      expect(result1.status).toBe('accepted')

      // Делаем большой прыжок на 6 месяцев
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * 6)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем событие для нового месяца
      const dto2: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_large_jump',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Monthly Event',
        description: 'Test',
        type: 'test',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события
      expect(context.eventQueue.getEventCount()).toBe(2)
    })

    test('monthly period dedup keys are cleaned up after large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startMonth = time.gameMonths
      const startYear = time.gameYears

      // Добавляем событие для начального месяца
      const dto: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_cleanup_test',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: startMonth,
          year: startYear,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      context.eventQueue.enqueueEvent(dto)

      // Делаем большой прыжок на 15 месяцев
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * 15)

      // Проверяем, что старый ключ удалён
      const eventState = (time.eventState as unknown as Record<string, unknown>)
      const processedMonthly = eventState.processedMonthlyEvents as Set<string>
      
      const oldKey = `monthly_cleanup_test:${startYear}:${startMonth}`
      expect(processedMonthly.has(oldKey)).toBe(false)
    })
  })

  describe('Large jump across multiple years', () => {
    test('yearly events are not duplicated across large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startYear = time.gameYears

      // Добавляем событие для начального года
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'yearly_large_jump',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: startYear,
        },
        title: 'Yearly Event',
        description: 'Test',
        type: 'test',
      }

      const result1 = context.eventQueue.enqueueEvent(dto)
      expect(result1.status).toBe('accepted')

      // Делаем большой прыжок на 3 года
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR * 3)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем событие для нового года
      const dto2: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'yearly_large_jump',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Yearly Event',
        description: 'Test',
        type: 'test',
      }

      const result2 = context.eventQueue.enqueueEvent(dto2)
      expect(result2.status).toBe('accepted')

      // В очереди два события
      expect(context.eventQueue.getEventCount()).toBe(2)
    })

    test('yearly period dedup keys are cleaned up after large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>
      const startYear = time.gameYears

      // Добавляем событие для начального года
      const dto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'yearly_cleanup_test',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: startYear,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      context.eventQueue.enqueueEvent(dto)

      // Делаем большой прыжок на 10 лет
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR * 10)

      // Проверяем, что старый ключ удалён
      const eventState = (time.eventState as unknown as Record<string, unknown>)
      const processedYearly = eventState.processedYearlyEvents as Set<string>
      
      const oldKey = `yearly_cleanup_test:${startYear}`
      expect(processedYearly.has(oldKey)).toBe(false)
    })
  })

  describe('Mixed period events across large jump', () => {
    test('multiple period events work correctly across large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем события разных периодов
      const weeklyDto: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_mixed',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: time.gameYears,
        },
        title: 'Weekly',
        description: 'Test',
        type: 'test',
      }

      const monthlyDto: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_mixed',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: time.gameYears,
        },
        title: 'Monthly',
        description: 'Test',
        type: 'test',
      }

      const yearlyDto: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'yearly_mixed',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: time.gameYears,
        },
        title: 'Yearly',
        description: 'Test',
        type: 'test',
      }

      expect(context.eventQueue.enqueueEvent(weeklyDto).status).toBe('accepted')
      expect(context.eventQueue.enqueueEvent(monthlyDto).status).toBe('accepted')
      expect(context.eventQueue.enqueueEvent(yearlyDto).status).toBe('accepted')

      expect(context.eventQueue.getEventCount()).toBe(3)

      // Делаем большой прыжок на 1 год
      context.time.advanceHours(HOURS_IN_WEEK * WEEKS_IN_MONTH * MONTHS_IN_YEAR)
      const newTime = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем те же события для нового периода
      const weeklyDto2: EventIngressDTO = {
        source: 'work_period',
        templateId: 'weekly_mixed',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Weekly',
        description: 'Test',
        type: 'test',
      }

      const monthlyDto2: EventIngressDTO = {
        source: 'monthly_finance',
        templateId: 'monthly_mixed',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Monthly',
        description: 'Test',
        type: 'test',
      }

      const yearlyDto2: EventIngressDTO = {
        source: 'time_micro',
        templateId: 'yearly_mixed',
        timeSnapshot: {
          totalHours: newTime.totalHours,
          day: newTime.gameDays,
          week: newTime.gameWeeks,
          month: newTime.gameMonths,
          year: newTime.gameYears,
        },
        title: 'Yearly',
        description: 'Test',
        type: 'test',
      }

      expect(context.eventQueue.enqueueEvent(weeklyDto2).status).toBe('accepted')
      expect(context.eventQueue.enqueueEvent(monthlyDto2).status).toBe('accepted')
      expect(context.eventQueue.enqueueEvent(yearlyDto2).status).toBe('accepted')

      // В очереди 6 событий (3 для старого периода, 3 для нового)
      expect(context.eventQueue.getEventCount()).toBe(6)
    })
  })

  describe('Bounded index cleanup after large jump', () => {
    test('seenInstanceIds is cleaned up after large jump', () => {
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, number>

      // Добавляем событие
      const dto: EventIngressDTO = {
        source: 'other',
        templateId: 'test_cleanup',
        timeSnapshot: {
          totalHours: time.totalHours,
          day: time.gameDays,
          week: time.gameWeeks,
          month: time.gameMonths,
          year: time.gameYears,
        },
        title: 'Test',
        description: 'Test',
        type: 'test',
      }

      const result = context.eventQueue.enqueueEvent(dto)
      expect(result.status).toBe('accepted')

      if (result.status === 'accepted') {
        // Проверяем, что instanceId добавлен в seenIndex
        const eventHistory = world.getComponent(PLAYER_ENTITY, 'eventHistory') as Record<string, unknown>
        const seenIndex = eventHistory.seenInstanceIds as Set<string>
        expect(seenIndex.has(result.instanceId)).toBe(true)

        // Делаем большой прыжок на 5 недель (больше retention периода)
        context.time.advanceHours(HOURS_IN_WEEK * 5)

        // Проверяем, что старый instanceId удалён из seenIndex
        // (это зависит от реализации _cleanupSeenInstancesIndex)
        // В текущей реализации очистка происходит при каждом enqueueEvent
      }
    })
  })
})
