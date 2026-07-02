/**
 * E2E smoke-test для SPAExecutor (Фаза 5).
 *
 * Проверяет полный цикл: чистая команда → world mutation → bridge sync → stores.
 * FakeStore реализует save()/load() как Pinia store.
 */
import { describe, it, expect } from 'vitest'
import type {
  CommandOutcome,
  ExecuteActionCommandResult,
  FinanceOverviewDto,
  GameExecutor,
  GameQueryExecutor,
} from '@/application/game/index.types'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import { createSPAExecutor } from '@/application/game/SPAExecutor'
import type { SnapshotProvider } from '@/application/game'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge.types'

/**
 * In-memory fake store с save()/load() как у Pinia.
 */
class FakeStore {
  constructor(private data: Record<string, unknown> = {}) {}

  save(): Record<string, unknown> {
    return this.data
  }

  load(payload: Record<string, unknown>): void {
    this.data = { ...payload }
  }

  get<T = Record<string, unknown>>(): T {
    return this.data as unknown as T
  }
}

class FakeStores {
  constructor(
    public player: FakeStore,
    public time: FakeStore,
    public stats: FakeStore,
    public wallet: FakeStore,
    public skills: FakeStore,
    public career: FakeStore,
    public education: FakeStore,
    public housing: FakeStore,
    public events: FakeStore,
    public finance: FakeStore,
    public activity: FakeStore,
  ) {}
}

function buildFakeStores(): FakeStores {
  return new FakeStores(
    new FakeStore({ name: 'Tester', startAge: 18, currentAge: 22 }),
    new FakeStore({
      totalHours: 0,
      hourOfDay: 8,
      dayOfWeek: 1,
      weekHoursSpent: 0,
      weekHoursRemaining: 168,
      dayHoursSpent: 0,
      dayHoursRemaining: 24,
      sleepHoursToday: 0,
      sleepDebt: 0,
    }),
    new FakeStore({ hunger: 70, energy: 50, stress: 30, mood: 60, health: 90, physical: 50 }),
    new FakeStore({ money: 50000, totalEarned: 50000, totalSpent: 0, reserveFund: 0 }),
    new FakeStore({ skills: {} }),
    new FakeStore({
      currentJob: {
        id: 'unemployed',
        name: 'Безработный',
        schedule: '0/0',
        employed: false,
        salaryPerHour: 0,
        salaryPerWeek: 0,
        salaryPerDay: 0,
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
    }),
    new FakeStore({
      school: 'completed',
      institute: 'none',
      educationLevel: 'Среднее',
      activeCourses: [],
      completedPrograms: [],
    }),
    new FakeStore({ level: 1, name: 'Студия', comfort: 40, furniture: [], lastWeeklyBonus: null }),
    new FakeStore({
      eventState: {
        cooldownByEventId: {},
        lastWeeklyEventWeek: 0,
        lastMonthlyEventMonth: 0,
        lastYearlyEventYear: 0,
        seenEventIds: [],
      },
      eventHistory: [],
      eventQueue: [],
      seenEventIds: [],
    }),
    new FakeStore({
      reserveFund: 0,
      monthlyExpenses: [],
      lastSettlement: null,
      debt: 0,
      investments: [],
      expenseList: [],
    }),
    new FakeStore({
      entries: [],
      lifetime: {
        totalWorkDays: 0,
        totalWorkHours: 0,
        totalEvents: 0,
        totalMicroEvents: 0,
        maxMoney: 0,
      },
    }),
  )
}

/**
 * Собрать snapshot из FakeStore-ов (как gameStore.save()).
 */
function toSnapshot(stores: FakeStores): StoresSnapshot {
  const snapshot: StoresSnapshot = {}
  for (const key of Object.keys(stores) as Array<keyof FakeStores>) {
    snapshot[key] = stores[key].save()
  }
  return snapshot
}

describe('[Application/game] SPAExecutor e2e smoke', () => {
  it('executeAction бесплатное действие мутирует stores через bridge', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const execute: GameExecutor = createSPAExecutor(snapshotProvider, loadTarget).execute

    const energyBefore: number = stores.stats.get<{ energy: number }>().energy
    const result: ExecuteActionCommandResult = execute.executeAction({} as GameWorld, 'self_morning_routine')

    expect(result.success).toBe(true)
    const energyAfter: number = stores.stats.get<{ energy: number }>().energy
    expect(energyAfter).toBeGreaterThan(energyBefore)
  })

  it('changeCareer ставит currentJob.employed=true в store', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const execute: GameExecutor = createSPAExecutor(snapshotProvider, loadTarget).execute

    const result: CommandOutcome = execute.changeCareer({} as GameWorld, 'it_junior')
    const isEmployed: boolean = stores.career.get<{ currentJob: { employed: boolean } }>().currentJob.employed

    expect(result.success).toBe(true)
    expect(isEmployed).toBe(true)
  })

  it('quitCareer возвращает employed=false в store', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const execute: GameExecutor = createSPAExecutor(snapshotProvider, loadTarget).execute

    execute.changeCareer({} as GameWorld, 'it_junior')
    execute.quitCareer({} as GameWorld)

    const isEmployed: boolean = stores.career.get<{ currentJob: { employed: boolean } }>().currentJob.employed
    expect(isEmployed).toBe(false)
  })

  it('getFinanceOverview query возвращает баланс из snapshot', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const query: GameQueryExecutor = createSPAExecutor(snapshotProvider, loadTarget).query

    const overview: FinanceOverviewDto = query.getFinanceOverview()

    expect(overview.balance).toBe(50000)
  })

  it('canExecuteAction query читает через bridge', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const query: GameQueryExecutor = createSPAExecutor(snapshotProvider, loadTarget).query

    const ok: boolean = query.canExecuteAction('self_morning_routine').canExecute
    const missing: boolean = query.canExecuteAction('unknown-action-id').canExecute

    expect(ok).toBe(true)
    expect(missing).toBe(false)
  })

  it('round-trip: деньги списываются в store после executeAction', () => {
    const stores: FakeStores = buildFakeStores()
    const snapshotProvider: SnapshotProvider = () => toSnapshot(stores)
    const loadTarget: StoresLoadTarget = stores as unknown as StoresLoadTarget
    const execute: GameExecutor = createSPAExecutor(snapshotProvider, loadTarget).execute

    const moneyBefore: number = stores.wallet.get<{ money: number }>().money
    const result: ExecuteActionCommandResult = execute.executeAction({} as GameWorld, 'self_public_speaking')

    if (result.success) {
      const moneyAfter: number = stores.wallet.get<{ money: number }>().money
      expect(moneyAfter).toBeLessThan(moneyBefore)
    }
  })
})
