import { describe, it, expect } from 'vitest'
import type { AvailabilityCheck } from '@/application/game/async-executor.types'
import type { FinanceOverviewDto, FinanceSnapshotDto } from '@/application/game/index.types'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  canExecuteAction,
  getCareerTrack,
  getFinanceOverview,
  getFinanceSnapshot,
  getInvestments,
  peekScheduledEvent,
  getEventQueue,
  getActivityLog,
  getActivityLogEntries,
  getActivityTimelineWindow,
} from '@/application/game/queries'
import type { ActivityEntry, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { GameEventPayload } from '@/domain/game-world/commands/commands.types'

function buildWorld(): GameWorld {
  const empty: GameWorld = GameWorld.createEmpty()
  const snapshot: GameWorldSnapshot = empty.toSnapshot()

  snapshot.wallet.money = 1000
  snapshot.wallet.totalEarnings = 5000
  snapshot.wallet.totalSpent = 2000
  snapshot.wallet.reserveFund = 300

  snapshot.career.currentJob = {
    id: 'junior-dev',
    name: 'Junior Dev',
    schedule: '5/2',
    employed: true,
    salaryPerHour: 100,
    salaryPerWeek: 4000,
    salaryPerDay: 800,
    requiredHoursPerWeek: 40,
    workedHoursCurrentWeek: 0,
    pendingSalaryWeek: 0,
    totalWorkedHours: 0,
    level: 1,
    daysAtWork: 0,
  }
  snapshot.career.careerLevel = 1

  snapshot.finance.reserveFund = 300
  snapshot.finance.monthlyExpenses = { food: 500 }
  snapshot.finance.expenseList = [{ category: 'food', amount: 500 }]
  snapshot.finance.investments = [
    { id: 'inv1', type: 'stocks', amount: 1000, returnRate: 7 } as never,
  ]

  snapshot.events.pending = [{ id: 'evt1', title: 'Test' } as unknown as GameEventPayload]

  snapshot.activity.entries = [
    { id: 1, type: 'work', title: 'Worked' } as unknown as ActivityEntry,
    { id: 2, type: 'event', title: 'Event' } as unknown as ActivityEntry,
    { id: 3, type: 'work', title: 'Worked again' } as unknown as ActivityEntry,
  ]

  return new GameWorld(snapshot)
}

describe('[Application/game] pure queries', () => {
  it('getCareerTrack возвращает currentJob когда employed', () => {
    const world: GameWorld = buildWorld()

    expect(getCareerTrack(world)).toHaveLength(1)
  })

  it('getFinanceOverview возвращает money и earnings', () => {
    const world: GameWorld = buildWorld()
    const overview: FinanceOverviewDto = getFinanceOverview(world)

    expect(overview.balance).toBe(1000)
    expect(overview.income).toBe(5000)
  })

  it('getFinanceSnapshot возвращает DTO', () => {
    const world: GameWorld = buildWorld()
    const snapshot: FinanceSnapshotDto = getFinanceSnapshot(world)

    expect(snapshot.money).toBe(1000)
    expect(snapshot.monthlyExpenses.food).toBe(500)
    expect(snapshot.portfolios).toHaveLength(1)
  })

  it('getInvestments возвращает investment list', () => {
    const world: GameWorld = buildWorld()

    expect(getInvestments(world)).toHaveLength(1)
  })

  it('canExecuteAction rejects unknown action', () => {
    const world: GameWorld = buildWorld()
    const result: AvailabilityCheck = canExecuteAction(world, 'unknown-action-id')

    expect(result.canExecute).toBe(false)
  })

  it('peekScheduledEvent возвращает head of pending', () => {
    const world: GameWorld = buildWorld()
    const event: GameEventPayload | null = peekScheduledEvent(world)

    expect(event?.id).toBe('evt1')
  })

  it('getEventQueue возвращает pending', () => {
    const world: GameWorld = buildWorld()

    expect(getEventQueue(world)).toHaveLength(1)
  })

  it('getActivityLogEntries возвращает последние N', () => {
    const world: GameWorld = buildWorld()

    expect(getActivityLogEntries(world, 2)).toHaveLength(2)
  })

  it('getActivityLog фильтрует по type', () => {
    const world: GameWorld = buildWorld()
    const filtered: ActivityEntry[] = getActivityLog(world, 'work')

    expect(filtered).toHaveLength(2)
    expect(filtered.every((e: ActivityEntry) => e.type === 'work')).toBe(true)
  })

  it('getActivityTimelineWindow возвращает последние N', () => {
    const world: GameWorld = buildWorld()

    expect(getActivityTimelineWindow(world, 1)).toHaveLength(1)
  })
})
