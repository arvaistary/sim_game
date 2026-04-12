import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useGameStore } from '@/stores/game.store'
import { DEFAULT_SAVE } from '@/domain/balance/constants/default-save'

function installLocalStorageMock(): void {
  const storage = new Map<string, string>()
  const localStorageMock = {
    getItem(key: string): string | null {
      return storage.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      storage.set(key, value)
    },
    removeItem(key: string): void {
      storage.delete(key)
    },
    clear(): void {
      storage.clear()
    },
  }

  vi.stubGlobal('localStorage', localStorageMock)
}

describe('integration/store game store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    installLocalStorageMock()
  })

  test('initializes world via facade', () => {
    const store = useGameStore()
    store.initWorld({ playerName: 'IntegrationTester' })
    expect(store.isInitialized).toBe(true)
  })

  test('work shift updates normalized time and weekly progress', () => {
    const store = useGameStore()
    store.initWorld(structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>)

    const beforeWeekHoursRemaining = store.time?.weekHoursRemaining ?? 0
    const beforeWorked = store.currentJobSnapshot?.workedHoursCurrentWeek ?? 0

    store.applyWorkShift(8)

    expect((store.time?.weekHoursRemaining ?? 0)).toBe(beforeWeekHoursRemaining - 8)
    expect((store.currentJobSnapshot?.workedHoursCurrentWeek ?? 0)).toBe(beforeWorked + 8)
  })

  test('currentJobSnapshot prefers work component over legacy career.currentJob', () => {
    const store = useGameStore()
    store.initWorld(structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>)

    const world = store.getWorld()
    expect(world).toBeTruthy()
    if (!world) return

    const work = world.getComponent<Record<string, unknown>>('player', 'work')
    const career = world.getComponent<Record<string, unknown>>('player', 'career')
    expect(work).toBeTruthy()
    expect(career).toBeTruthy()
    if (!work || !career) return

    work.name = 'Тестовая работа из work'
    career.currentJob = { id: 'legacy_job', name: 'Легаси работа' }

    expect(store.currentJobSnapshot?.name).toBe('Тестовая работа из work')
  })

  test('single work shift creates exactly one work log entry', () => {
    const store = useGameStore()
    const save = structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>
    save.time = {
      ...(save.time as Record<string, unknown>),
      totalHours: 3600,
      gameDays: 150,
      gameWeeks: 22,
      gameMonths: 6,
      weekHoursSpent: 8,
      weekHoursRemaining: 160,
    }
    store.initWorld(save)

    const before = store
      .getActivityLogEntries(100)
      .filter(entry => entry.title === '💼 Отработана смена').length

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
    store.applyWorkShift(8)
    randomSpy.mockRestore()

    const after = store
      .getActivityLogEntries(100)
      .filter(entry => entry.title === '💼 Отработана смена').length

    expect(after - before).toBe(1)
  })

  test('save → reload maintains consistency across profile, career, time, and logs', () => {
    const store = useGameStore()
    const save = structuredClone(DEFAULT_SAVE) as unknown as Record<string, unknown>
    save.time = {
      ...(save.time as Record<string, unknown>),
      totalHours: 3600,
      gameDays: 150,
      gameWeeks: 22,
      gameMonths: 6,
      weekHoursSpent: 8,
      weekHoursRemaining: 160,
    }
    store.initWorld(save)

    // Capture state before action
    const beforeJobName = store.currentJobSnapshot?.name
    const beforeWeekHoursRemaining = store.time?.weekHoursRemaining
    const beforeWorkedHours = store.currentJobSnapshot?.workedHoursCurrentWeek
    const beforeLogCount = store.getActivityLogEntries(100).length

    // Perform work action
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(1)
    store.applyWorkShift(8)
    randomSpy.mockRestore()

    // Capture state after action, before save
    const afterActionJobName = store.currentJobSnapshot?.name
    const afterActionWeekHoursRemaining = store.time?.weekHoursRemaining
    const afterActionWorkedHours = store.currentJobSnapshot?.workedHoursCurrentWeek
    const afterActionLogCount = store.getActivityLogEntries(100).length

    // Verify action had expected effects
    expect(afterActionJobName).toBe(beforeJobName)
    expect(afterActionWeekHoursRemaining).toBe((beforeWeekHoursRemaining ?? 0) - 8)
    expect(afterActionWorkedHours).toBe((beforeWorkedHours ?? 0) + 8)
    expect(afterActionLogCount).toBe(beforeLogCount + 1)

    // applyWorkShift already persists via save(); ensure snapshot is written
    store.save()

    // New Pinia instance simulates a fresh app load: init empty world, then hydrate from localStorage
    setActivePinia(createPinia())
    const reloadedStore = useGameStore()
    reloadedStore.initWorld({ playerName: 'IntegrationTester' })
    expect(reloadedStore.load()).toBe(true)

    // Verify all data is consistent after reload
    expect(reloadedStore.currentJobSnapshot?.name).toBe(afterActionJobName)
    expect(reloadedStore.time?.weekHoursRemaining).toBe(afterActionWeekHoursRemaining)
    expect(reloadedStore.currentJobSnapshot?.workedHoursCurrentWeek).toBe(afterActionWorkedHours)
    expect(reloadedStore.getActivityLogEntries(100).length).toBe(afterActionLogCount)

    // Verify time fields are normalized
    expect(reloadedStore.time?.totalHours).toBeGreaterThan(0)
    expect(reloadedStore.time?.gameDays).toBeGreaterThan(0)
    expect(reloadedStore.time?.gameWeeks).toBeGreaterThan(0)

    // Verify career and work components are synchronized
    const world = reloadedStore.getWorld()
    expect(world).toBeTruthy()
    if (world) {
      const work = world.getComponent<Record<string, unknown>>('player', 'work')
      const career = world.getComponent<Record<string, unknown>>('player', 'career')
      expect(work?.id).toBe(career?.id)
      expect(work?.name).toBe(career?.name)
      expect(work?.salaryPerHour).toBe(career?.salaryPerHour)
    }
  })
})
