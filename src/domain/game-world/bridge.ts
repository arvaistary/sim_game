/**
 * Bridge между Pinia stores и GameWorld.
 *
 * @deprecated Временный модуль для миграционного периода (Фазы 2-4 плана
 * game_world_aggregate_foundation). После того как все stores станут
 * projections над GameWorld, этот модуль будет удалён (задача f5_remove_bridge).
 *
 * Принимает/возвращает plain объекты (snapshots), НЕ Pinia refs — domain
 * не зависит от Vue реактивности. Вызывающий код (composables/application)
 * отвечает за чтение/запись store.save()/load().
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { ActivityEntry, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge.types'
import { recalculateSkillModifiers } from '@/domain/balance/constants/skill-modifiers'
import { INITIAL_STATS } from '@/domain/balance/constants/initial-stats'
import type { SkillModifiers } from '@/domain/balance/types'

export type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge.types'

function readNumber(record: Record<string, unknown> | undefined, key: string, fallback: number): number {
  if (!record) return fallback
  const value: unknown = record[key]
  return typeof value === 'number' ? value : fallback
}

function readString(record: Record<string, unknown> | undefined, key: string, fallback: string): string {
  if (!record) return fallback
  const value: unknown = record[key]
  return typeof value === 'string' ? value : fallback
}

const UNEMPLOYED_JOB: GameWorldSnapshot['career']['currentJob'] = {
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
}

/**
 * Собрать GameWorld из snapshot-ов Pinia stores.
 * @description [Domain] - миграционный bridge, удалить в Фазе 5.
 * @deprecated Миграционный bridge, удалить в Фазе 5.
 * @param stores snapshot данных stores (как gameStore.save())
 * @return { GameWorld } восстановленный мир
 */
export function fromStores(stores: StoresSnapshot): GameWorld {
  const player: Record<string, unknown> = stores.player ?? {}
  const time: Record<string, unknown> = stores.time ?? {}
  const stats: Record<string, unknown> = stores.stats ?? {}
  const wallet: Record<string, unknown> = stores.wallet ?? {}
  const skillsRaw: Record<string, unknown> = stores.skills ?? {}
  const career: Record<string, unknown> = stores.career ?? {}
  const education: Record<string, unknown> = stores.education ?? {}
  const housing: Record<string, unknown> = stores.housing ?? {}
  const events: Record<string, unknown> = stores.events ?? {}
  const finance: Record<string, unknown> = stores.finance ?? {}
  const activity: Record<string, unknown> = stores.activity ?? {}
  const actions: Record<string, unknown> = stores.actions ?? {}

  const skillsLevels: Record<string, number | { level: number; xp: number }> = (skillsRaw.skills ?? {}) as Record<string, number | { level: number; xp: number }>
  const skillModifiers: SkillModifiers = recalculateSkillModifiers(skillsLevels)

  const snapshot: GameWorldSnapshot = {
    player: {
      playerName: readString(player, 'name', ''),
      startAge: readNumber(player, 'startAge', 18),
      currentAge: readNumber(player, 'currentAge', 18),
    },
    time: {
      totalHours: readNumber(time, 'totalHours', 0),
      hourOfDay: readNumber(time, 'hourOfDay', 0),
      dayOfWeek: readNumber(time, 'dayOfWeek', 1),
      weekHoursSpent: readNumber(time, 'weekHoursSpent', 0),
      weekHoursRemaining: readNumber(time, 'weekHoursRemaining', 168),
      dayHoursSpent: readNumber(time, 'dayHoursSpent', 0),
      dayHoursRemaining: readNumber(time, 'dayHoursRemaining', 24),
      sleepHoursToday: readNumber(time, 'sleepHoursToday', 0),
      sleepDebt: readNumber(time, 'sleepDebt', 0),
    },
    stats: {
      hunger: readNumber(stats, 'hunger', INITIAL_STATS.hunger),
      energy: readNumber(stats, 'energy', INITIAL_STATS.energy),
      stress: readNumber(stats, 'stress', INITIAL_STATS.stress),
      mood: readNumber(stats, 'mood', INITIAL_STATS.mood),
      health: readNumber(stats, 'health', INITIAL_STATS.health),
      physical: readNumber(stats, 'physical', INITIAL_STATS.physical),
    },
    wallet: {
      money: readNumber(wallet, 'money', 0),
      totalEarnings: readNumber(wallet, 'totalEarned', 0),
      totalSpent: readNumber(wallet, 'totalSpent', 0),
      reserveFund: readNumber(wallet, 'reserveFund', 0),
    },
    career: {
      currentJob: { ...UNEMPLOYED_JOB, ...((career.currentJob ?? {}) as Partial<GameWorldSnapshot['career']['currentJob']>) },
      jobHistory: Array.isArray(career.jobHistory) ? (career.jobHistory as GameWorldSnapshot['career']['jobHistory']) : [],
      careerLevel: readNumber(career, 'careerLevel', 0),
      promotions: readNumber(career, 'promotions', 0),
    },
    housing: (housing as unknown as GameWorldSnapshot['housing']) ?? {
      level: 0,
      name: 'Нет жилья',
      comfort: 0,
      furniture: [],
      lastWeeklyBonus: null,
    },
    skills: {
      levels: skillsLevels,
      modifiers: skillModifiers,
    },
    education: (education as unknown as GameWorldSnapshot['education']) ?? {
      school: 'none',
      institute: 'none',
      educationLevel: 'Нет',
      activeCourses: [],
      cognitiveLoad: 0,
      studyHoursSinceLastSleep: 0,
      completedPrograms: [],
    },
    relationships: [],
    finance: normalizeFinanceStoreSnapshot(finance),
    events: normalizeEventsStoreSnapshot(events),
    activity: normalizeActivityStoreSnapshot(activity),
    actionUsage: normalizeActionUsageSnapshot(actions),
    tags: { items: [] },
  }

  return new GameWorld(snapshot)
}

function normalizeActionUsageSnapshot(actions: Record<string, unknown>): NonNullable<GameWorldSnapshot['actionUsage']> {
  const raw = actions.actionUsage
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const result: NonNullable<GameWorldSnapshot['actionUsage']> = {}
  for (const [actionId, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue
    const usage = value as { count?: unknown; lastUsedAt?: unknown }
    if (typeof usage.count === 'number' && typeof usage.lastUsedAt === 'number') {
      result[actionId] = { count: usage.count, lastUsedAt: usage.lastUsedAt }
    }
  }
  return result
}

/**
 * Адаптер finance-store snapshot → GameWorldSnapshot['finance'].
 * finance-store сохраняет { investments, monthlyExpenses, lastSettlement, debt },
 * GameWorld хранит { reserveFund, monthlyExpenses (Record), lastMonthlySettlement, debt, investments, expenseList }.
 */
function normalizeFinanceStoreSnapshot(finance: Record<string, unknown>): GameWorldSnapshot['finance'] {
  const monthlyExpensesList: Array<{ category: string; amount: number }> = Array.isArray(finance.monthlyExpenses)
    ? finance.monthlyExpenses as Array<{ category: string; amount: number }>
    : []
  const monthlyExpensesRecord: Record<string, number> = {}
  for (const exp of monthlyExpensesList) {
    monthlyExpensesRecord[exp.category] = exp.amount
  }

  return {
    reserveFund: readNumber(finance, 'reserveFund', 0),
    monthlyExpenses: monthlyExpensesRecord,
    lastMonthlySettlement: typeof finance.lastSettlement === 'number' ? finance.lastSettlement : null,
    debt: readNumber(finance, 'debt', 0),
    investments: Array.isArray(finance.investments) ? finance.investments as GameWorldSnapshot['finance']['investments'] : [],
    expenseList: monthlyExpensesList,
  }
}

/**
 * Адаптер events-store snapshot → GameWorldSnapshot['events'].
 * events-store сохраняет { eventQueue, eventHistory, seenEventIds, eventState? },
 * GameWorld хранит { state, history, pending }.
 */
function normalizeEventsStoreSnapshot(events: Record<string, unknown>): GameWorldSnapshot['events'] {
  const stateRaw: Partial<GameWorldSnapshot['events']['state']> = (events.eventState ?? events.state ?? {}) as Partial<GameWorldSnapshot['events']['state']>
  const history: unknown[] = Array.isArray(events.eventHistory) ? events.eventHistory : (Array.isArray(events.history) ? events.history : [])
  const pending: unknown[] = Array.isArray(events.eventQueue) ? events.eventQueue : (Array.isArray(events.pending) ? events.pending : [])

  return {
    state: {
      cooldownByEventId: (stateRaw.cooldownByEventId ?? {}) as Record<string, number>,
      lastWeeklyEventWeek: typeof stateRaw.lastWeeklyEventWeek === 'number' ? stateRaw.lastWeeklyEventWeek : 0,
      lastMonthlyEventMonth: typeof stateRaw.lastMonthlyEventMonth === 'number' ? stateRaw.lastMonthlyEventMonth : 0,
      lastYearlyEventYear: typeof stateRaw.lastYearlyEventYear === 'number' ? stateRaw.lastYearlyEventYear : 0,
      seenEventIds: Array.isArray(events.seenEventIds)
        ? events.seenEventIds as string[]
        : (Array.isArray(stateRaw.seenEventIds) ? stateRaw.seenEventIds as string[] : []),
    },
    history,
    pending,
  }
}

/**
 * Адаптер activity-store snapshot → GameWorldSnapshot['activity'].
 * activity-store сохраняет { entries, nextId }, lifetime может отсутствовать.
 */
function normalizeActivityStoreSnapshot(activity: Record<string, unknown>): GameWorldSnapshot['activity'] {
  const entries: ActivityEntry[] = Array.isArray(activity.entries) ? activity.entries as ActivityEntry[] : []
  const lifetimeRaw: Partial<GameWorldSnapshot['activity']['lifetime']> = (activity.lifetime ?? {}) as Partial<GameWorldSnapshot['activity']['lifetime']>

  return {
    entries,
    lifetime: {
      totalWorkDays: typeof lifetimeRaw.totalWorkDays === 'number' ? lifetimeRaw.totalWorkDays : 0,
      totalWorkHours: typeof lifetimeRaw.totalWorkHours === 'number' ? lifetimeRaw.totalWorkHours : 0,
      totalEvents: typeof lifetimeRaw.totalEvents === 'number' ? lifetimeRaw.totalEvents : 0,
      totalMicroEvents: typeof lifetimeRaw.totalMicroEvents === 'number' ? lifetimeRaw.totalMicroEvents : 0,
      maxMoney: typeof lifetimeRaw.maxMoney === 'number' ? lifetimeRaw.maxMoney : 0,
    },
  }
}

/**
 * Запушить состояние из GameWorld обратно в Pinia stores через их load().
 * @description [Domain] - миграционный bridge, удалить в Фазе 5.
 * @deprecated Миграционный bridge, удалить в Фазе 5.
 * @param world источник состояния
 * @param stores целевые stores с load()
 * @return { void }
 */
export function applyToStores(world: GameWorld, stores: StoresLoadTarget): void {
  const snapshot: GameWorldSnapshot = world.toSnapshot()

  if (stores.player?.load) {
    stores.player.load({
      name: snapshot.player.playerName,
      startAge: snapshot.player.startAge,
      currentAge: snapshot.player.currentAge,
    })
  }

  if (stores.time?.load) {
    stores.time.load({
      ...snapshot.time,
      startAge: snapshot.player.startAge,
    } as unknown as Record<string, unknown>)
  }

  if (stores.stats?.load) {
    stores.stats.load(snapshot.stats as unknown as Record<string, unknown>)
  }

  if (stores.wallet?.load) {
    stores.wallet.load({
      money: snapshot.wallet.money,
      totalEarned: snapshot.wallet.totalEarnings,
      totalSpent: snapshot.wallet.totalSpent,
      reserveFund: snapshot.wallet.reserveFund,
    })
  }

  if (stores.skills?.load) {
    stores.skills.load({ skills: snapshot.skills.levels })
  }

  if (stores.career?.load) {
    stores.career.load({
      currentJob: snapshot.career.currentJob,
      jobHistory: snapshot.career.jobHistory,
      careerLevel: snapshot.career.careerLevel,
      promotions: snapshot.career.promotions,
    })
  }

  if (stores.education?.load) {
    stores.education.load(snapshot.education as unknown as Record<string, unknown>)
  }

  if (stores.housing?.load) {
    stores.housing.load(snapshot.housing as unknown as Record<string, unknown>)
  }

  if (stores.events?.load) {
    stores.events.load({
      eventState: snapshot.events.state,
      eventHistory: snapshot.events.history,
      eventQueue: snapshot.events.pending,
      seenEventIds: snapshot.events.state.seenEventIds,
    })
  }

  if (stores.finance?.load) {
    stores.finance.load({
      investments: snapshot.finance.investments,
      monthlyExpenses: snapshot.finance.expenseList,
      lastSettlement: snapshot.finance.lastMonthlySettlement,
      debt: snapshot.finance.debt,
    })
  }

  if (stores.activity?.load) {
    stores.activity.load({
      entries: snapshot.activity.entries,
      lifetime: snapshot.activity.lifetime,
    })
  }

  if (stores.actions?.load) {
    stores.actions.load({ actionUsage: snapshot.actionUsage ?? {} })
  }
}
