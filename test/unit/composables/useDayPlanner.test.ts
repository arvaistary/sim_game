import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useDayPlannerStore } from '@/stores/day-planner-store'
import { useTimeStore } from '@/stores/time-store'

describe('useDayPlanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { gameMode: 'spa', gameOfflineQueue: false, gameApiBaseUrl: '' } }))
    useDayPlannerStore().resetPlan()
  })

  it('blocks unsupported sleep and plans longer than remaining day', () => {
    const planner = useDayPlanner()

    expect(planner.plan.value.sleepHours).toBe(7)
    expect(planner.canConfirm.value).toBe(true)

    planner.setSleepHours(6)
    expect(planner.canConfirm.value).toBe(false)

    planner.setSleepHours(8)
    planner.setWorkHours(17)
    expect(planner.canConfirm.value).toBe(false)
  })

  it('limits free actions by remaining hours and warns on high sleep debt', () => {
    const time = useTimeStore()
    time.sleepDebt = 80
    const planner = useDayPlanner()
    planner.resetPlan()
    planner.setSleepHours(7)

    expect(planner.sleepDebtWarning.value).toBe(true)
    expect(planner.freeActionHoursBudget.value).toBe(17)

    for (let index = 0; index < 8; index += 1) {
      expect(planner.addFreeAction('fun_park_walk')).toBe(true)
    }

    expect(planner.plannedActionHours.value).toBe(16)
    expect(planner.freeActionHoursRemaining.value).toBe(1)
    expect(planner.addFreeAction('fun_park_walk')).toBe(false)
    expect(planner.plan.value.actionIds).toHaveLength(8)
  })

  it('allows repeating the same action while hours remain', () => {
    const planner = useDayPlanner()
    planner.resetPlan()
    planner.setSleepHours(7)

    expect(planner.addFreeAction('fun_park_walk')).toBe(true)
    expect(planner.addFreeAction('fun_park_walk')).toBe(true)
    expect(planner.plan.value.actionIds).toEqual(['fun_park_walk', 'fun_park_walk'])
    expect(planner.plannedActionHours.value).toBe(4)
  })

  it('shares draft plan across composable instances (route navigation)', () => {
    const actionsPagePlanner = useDayPlanner()
    const dashboardPlanner = useDayPlanner()

    actionsPagePlanner.resetPlan()
    actionsPagePlanner.setSleepHours(7)

    expect(actionsPagePlanner.addFreeAction('fun_park_walk')).toBe(true)
    expect(actionsPagePlanner.addFreeAction('fun_park_walk')).toBe(true)

    expect(dashboardPlanner.plan.value.actionIds).toEqual(['fun_park_walk', 'fun_park_walk'])
    expect(dashboardPlanner.plannedActionHours.value).toBe(4)
  })

  it('persists draft plan through store save/load (page refresh)', () => {
    const planner = useDayPlanner()
    const store = useDayPlannerStore()

    planner.resetPlan()
    planner.setSleepHours(7)
    planner.addFreeAction('fun_park_walk')
    planner.addFreeAction('fun_cinema')

    const saved: Record<string, unknown> = store.save()

    store.resetPlan()
    expect(planner.plan.value.actionIds).toEqual([])

    store.load(saved)
    expect(planner.plan.value.actionIds).toEqual(['fun_park_walk', 'fun_cinema'])
  })
})
