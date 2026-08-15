import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCalendarPlanStore } from '@/stores/calendar-plan-store'

describe('calendar-plan-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('restores the multi-day draft after save/load', () => {
    const store = useCalendarPlanStore()

    store.setPlan({
      days: [
        { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] },
        { sleepHours: 8, workHours: 0, actionIds: ['social_call_parents'] },
      ],
    })

    const saved: Record<string, unknown> = store.save()
    store.reset()
    store.load(saved)

    expect(store.plan.days).toEqual([
      { sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] },
      { sleepHours: 8, workHours: 0, actionIds: ['social_call_parents'] },
    ])
  })

  it('duplicates below the source card and moves cards between days', () => {
    const store = useCalendarPlanStore()

    store.setPlan({
      days: [
        { sleepHours: 7, workHours: 0, actionIds: ['fun_park_walk', 'fun_cinema'] },
        { sleepHours: 7, workHours: 0, actionIds: [] },
      ],
    })

    store.duplicateAction(0, 0)
    expect(store.plan.days[0]?.actionIds).toEqual(['fun_park_walk', 'fun_park_walk', 'fun_cinema'])

    store.moveAction(0, 1, 1)
    expect(store.plan.days[0]?.actionIds).toEqual(['fun_park_walk', 'fun_cinema'])
    expect(store.plan.days[1]?.actionIds).toEqual(['fun_park_walk'])
  })

  it('pins cards, persists the pin and carries it to the next day', () => {
    const store = useCalendarPlanStore()

    store.setPlan({
      days: [
        { sleepHours: 7, workHours: 0, actionIds: ['fun_park_walk', 'fun_cinema'] },
        { sleepHours: 7, workHours: 0, actionIds: ['social_call_parents'] },
      ],
    })

    store.togglePin(0, 0)
    store.advanceAfterDay(2)

    expect(store.plan.days[0]?.actionIds).toEqual(['fun_park_walk', 'social_call_parents'])
    expect(store.plan.days[0]?.pinnedActionIndexes).toEqual([0])

    const saved: Record<string, unknown> = store.save()
    store.reset()
    store.load(saved)

    expect(store.plan.days[0]?.pinnedActionIndexes).toEqual([0])
  })

  it('removes unpinned cards when the current day is completed', () => {
    const store = useCalendarPlanStore()

    store.setPlan({
      days: [
        { sleepHours: 7, workHours: 0, actionIds: ['fun_park_walk'] },
        { sleepHours: 7, workHours: 0, actionIds: [] },
      ],
    })

    store.advanceAfterDay(2)

    expect(store.plan.days[0]?.actionIds).toEqual([])
    expect(store.plan.days).toHaveLength(2)
  })

  it('uses the scheduled replacement day after advancing the plan', () => {
    const store = useCalendarPlanStore()

    store.setPlan({
      days: [
        { sleepHours: 7, workHours: 8, actionIds: [] },
        { sleepHours: 8, workHours: 0, actionIds: [] },
      ],
    })

    store.advanceAfterDay(2, { sleepHours: 7, workHours: 8, actionIds: [] })

    expect(store.plan.days[1]?.workHours).toBe(8)
  })
})
