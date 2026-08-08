import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useTimeStore } from '@/stores/time-store'

describe('useDayPlanner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('useRuntimeConfig', () => ({ public: { gameMode: 'spa', gameOfflineQueue: false, gameApiBaseUrl: '' } }))
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

  it('limits free actions to three and warns on high sleep debt', () => {
    const time = useTimeStore()
    time.sleepDebt = 80
    const planner = useDayPlanner()
    planner.setSleepHours(7)

    expect(planner.sleepDebtWarning.value).toBe(true)
    expect(planner.addFreeAction('fun_park_walk')).toBe(true)
    expect(planner.addFreeAction('fun_series')).toBe(true)
    expect(planner.addFreeAction('fun_bath')).toBe(true)
    expect(planner.addFreeAction('fun_cinema')).toBe(false)
    expect(planner.plan.value.actionIds).toHaveLength(3)
  })
})
