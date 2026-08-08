// @vitest-environment happy-dom

import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import DayPlannerPanel from '@/components/pages/dashboard/DayPlannerPanel/DayPlannerPanel.vue'
import { useDayPlanner } from '@/composables/useDayPlanner'
import { useCareerStore } from '@/stores/career-store'
import { useStatsStore } from '@/stores/stats-store'
import { useTimeStore } from '@/stores/time-store'
import { useWalletStore } from '@/stores/wallet-store'
import { useSkillsStore } from '@/stores/skills-store'
import { useEducationStore } from '@/stores/education-store'
import { useFinanceStore } from '@/stores/finance-store'

const PanelStub = defineComponent({
  template: '<div><slot /></div>',
})

const ButtonStub = defineComponent({
  props: {
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
})

function mountDayPlanner(): ReturnType<typeof mount> {
  return mount(DayPlannerPanel, {
    global: {
      stubs: {
        RoundedPanel: PanelStub,
        GameButton: ButtonStub,
      },
    },
  })
}

describe('DayPlannerPanel integration flow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('useTimeStore', useTimeStore)
    vi.stubGlobal('useWalletStore', useWalletStore)
    vi.stubGlobal('useSkillsStore', useSkillsStore)
    vi.stubGlobal('useEducationStore', useEducationStore)
    vi.stubGlobal('useFinanceStore', useFinanceStore)
    vi.stubGlobal('useRuntimeConfig', () => ({
      public: { gameMode: 'spa', gameOfflineQueue: false, gameApiBaseUrl: '' },
    }))

    const planner = useDayPlanner()
    planner.resetPlan()
    useTimeStore().setTotalHours(0)
    useTimeStore().sleepDebt = 0
    useStatsStore().energy = 100
    useWalletStore().money = 1000
  })

  it('confirms complete plan through Pinia and SPA executor with one click', async () => {
    const career = useCareerStore()
    career.startWork({
      id: 'test-job',
      name: 'Тестовая работа',
      schedule: '5/2',
      salaryPerHour: 10,
      salaryPerDay: 80,
      salaryPerWeek: 400,
      requiredHoursPerWeek: 40,
      level: 1,
    })

    const planner = useDayPlanner()
    planner.setSleepHours(7)
    planner.setWorkHours(8)
    expect(planner.addFreeAction('fun_park_walk')).toBe(true)

    const wrapper = mountDayPlanner()
    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Прожить день')

    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    await flushPromises()
    await nextTick()

    expect(useTimeStore().totalHours).toBe(24)
    expect(career.currentJob.workedHoursCurrentWeek).toBe(8)
    expect(wrapper.text()).toContain('День завершён')
    expect(wrapper.text()).toContain('нейтрально: 7 ч')

    wrapper.unmount()
  })

  it('hides work section and closes day for unemployed character', async () => {
    const career = useCareerStore()
    career.endWork()

    const planner = useDayPlanner()
    planner.setSleepHours(7)
    const wrapper = mountDayPlanner()

    expect(wrapper.text()).not.toContain('Работа')

    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Прожить день')
    expect(confirmButton).toBeDefined()
    await confirmButton!.trigger('click')
    await flushPromises()
    await nextTick()

    expect(useTimeStore().totalHours).toBe(24)
    expect(career.currentJob.employed).toBe(false)

    wrapper.unmount()
  })

  it('unwraps planner refs in the UI and disables an invalid plan', async () => {
    const planner = useDayPlanner()
    const wrapper = mountDayPlanner()
    const confirmButton = wrapper.findAll('button').find((button) => button.text() === 'Прожить день')

    expect(wrapper.text()).toContain('Осталось часов: 24')
    expect(confirmButton?.attributes('disabled')).toBeUndefined()

    planner.setSleepHours(6)
    await nextTick()

    expect(confirmButton?.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
