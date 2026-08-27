import { describe, expect, it } from 'vitest'
import {
  createEmptyWorld,
  createWorldFromJSON,
  getGameFacade,
} from '@/domain/game-facade'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { fromStores, applyToStores } from '@/domain/game-world/bridge'
import type { StoresLoadTarget, StoresSnapshot } from '@/domain/game-world/bridge'
import type { GameFacade } from '@/domain/game-facade/game-facade.types'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

describe('game-facade', () => {
  it('createEmptyWorld возвращает GameWorld', () => {
    const world: GameWorld = createEmptyWorld()

    expect(world).toBeInstanceOf(GameWorld)
    expect(world.player.startAge).toBe(18)
  })

  it('createEmptyWorld принимает partial overrides', () => {
    const world: GameWorld = createEmptyWorld({
      player: { playerName: 'Тест', startAge: 20, currentAge: 20 },
    })

    expect(world.player.playerName).toBe('Тест')
  })

  it('createWorldFromJSON восстанавливает мир из JSON', () => {
    const original: GameWorld = createEmptyWorld({ player: { playerName: 'X', startAge: 30, currentAge: 35 } })
    const json: GameWorldJSON = original.toJSON()
    const restored: GameWorld = createWorldFromJSON(json)

    expect(restored.player.playerName).toBe('X')
    expect(restored.player.currentAge).toBe(35)
  })

  it('getGameFacade возвращает фасад с world и методами', () => {
    const world: GameWorld = createEmptyWorld()
    const facade: GameFacade = getGameFacade(world)

    expect(facade.world).toBe(world)
    expect(facade.toJSON().version).toBeTruthy()
    expect(facade.toSnapshot().player).toBeDefined()
  })
})

describe('bridge fromStores', () => {
  function buildStoresSnapshot(): StoresSnapshot {
    return {
      player: { name: 'ИзСтора', startAge: 22, currentAge: 27 },
      time: { totalHours: 500, sleepDebt: 3, startAge: 22 },
      stats: { energy: 75, health: 85, hunger: 60, stress: 25, mood: 65, physical: 50 },
      wallet: { money: 30000, totalEarned: 60000, totalSpent: 30000, reserveFund: 10000 },
      skills: { skills: { professionalism: 3, communication: 1 } },
      career: {
        currentJob: {
          id: 'office_worker',
          name: 'Офисный работник',
          schedule: '5/2',
          employed: true,
          salaryPerHour: 600,
          salaryPerWeek: 24000,
          salaryPerDay: 4800,
          requiredHoursPerWeek: 40,
          workedHoursCurrentWeek: 5,
          totalWorkedHours: 200,
          level: 1,
          daysAtWork: 25,
        },
      },
      education: {
        school: 'completed',
        institute: 'none',
        educationLevel: 'Среднее',
        activeCourses: [],
        completedPrograms: [],
      },
      housing: {
        level: 0,
        name: 'Нет жилья',
        comfort: 0,
        furniture: [],
        lastWeeklyBonus: null,
      },
      events: {
        state: {
          cooldownByEventId: {},
          lastWeeklyEventWeek: 0,
          lastMonthlyEventMonth: 0,
          lastYearlyEventYear: 0,
        },
        history: [],
        pending: [],
      },
      finance: {
        reserveFund: 10000,
        monthlyExpenses: {},
        lastMonthlySettlement: null,
        debt: 0,
      },
      activity: {
        entries: [],
        lifetime: {
          totalWorkDays: 0,
          totalWorkHours: 0,
          totalEvents: 0,
          totalMicroEvents: 0,
          maxMoney: 0,
        },
      },
    }
  }

  it('собирает GameWorld из snapshots всех stores', () => {
    const stores: StoresSnapshot = buildStoresSnapshot()
    const world: GameWorld = fromStores(stores)

    expect(world).toBeInstanceOf(GameWorld)
    expect(world.player.playerName).toBe('ИзСтора')
    expect(world.player.currentAge).toBe(27)
    expect(world.time.totalHours).toBe(500)
    expect(world.time.weekHoursSpent).toBe(500 % 168)
    expect(world.time.dayHoursSpent).toBe(500 % 24)
    expect(world.time.sleepDebt).toBe(3)
    expect(world.stats.energy).toBe(75)
    expect(world.wallet.money).toBe(30000)
    expect(world.wallet.totalEarnings).toBe(60000)
    expect(world.career.currentJob.id).toBe('office_worker')
    expect(world.skills.levels.professionalism?.level).toBe(3)
  })

  it('пересчитывает skillModifiers из skill levels', () => {
    const stores: StoresSnapshot = buildStoresSnapshot()
    const world: GameWorld = fromStores(stores)

    expect(world.skills.modifiers.salaryMultiplier).toBeGreaterThanOrEqual(1)
  })

  it('восстанавливает meta-progression из snapshot', () => {
    const world: GameWorld = fromStores({
      meta: {
        livesCompleted: 3,
        unlockedAchievements: ['first_job'],
      },
    })

    expect(world.meta.livesCompleted).toBe(3)
    expect(world.meta.unlockedAchievements).toEqual(['first_job'])
  })

  it('толерантен к частичным snapshots (использует дефолты)', () => {
    const partial: StoresSnapshot = {
      player: { name: 'Партик', currentAge: 19 },
    }
    const world: GameWorld = fromStores(partial)

    expect(world.player.playerName).toBe('Партик')
    expect(world.player.startAge).toBe(18)
    expect(world.wallet.money).toBe(0)
    expect(world.career.currentJob.employed).toBe(false)
  })

  it('не принимает неполный ended life snapshot', () => {
    const world: GameWorld = fromStores({ life: { status: 'ended', deathCause: 'illness' } })

    expect(world.life).toEqual({ status: 'active', lowMoodDays: 0, deathCause: null, summary: null })
  })
})

describe('bridge applyToStores', () => {
  it('пушит состояние из GameWorld в stores через load()', () => {
    const world: GameWorld = createEmptyWorld({
      player: { playerName: 'Push', startAge: 20, currentAge: 30 },
      wallet: { money: 1234, totalEarnings: 1234, totalSpent: 0, reserveFund: 0 },
    })

    const received: Record<string, Record<string, unknown>> = {}
    const stores: StoresLoadTarget = {
      player: { load: (data) => { received.player = data } },
      wallet: { load: (data) => { received.wallet = data } },
      time: { load: (data) => { received.time = data } },
    }

    applyToStores(world, stores)

    expect(received.player.name).toBe('Push')
    expect(received.player.currentAge).toBe(30)
    expect(received.wallet.money).toBe(1234)
    expect(received.time.totalHours).toBe(0)
  })

  it('толерантен к отсутствию load() у части stores', () => {
    const world: GameWorld = createEmptyWorld()
    const stores: StoresLoadTarget = {
      player: { load: () => {} },
    }

    expect(() => applyToStores(world, stores)).not.toThrow()
  })

  it('пушит meta-progression в отдельный store', () => {
    const world: GameWorld = createEmptyWorld()
    world.meta.livesCompleted = 2

    let received: Record<string, unknown> | undefined
    applyToStores(world, { meta: { load: (data) => { received = data } } })

    expect(received?.livesCompleted).toBe(2)
  })
})

describe('bridge round-trip', () => {
  it('fromStores → applyToStores не теряет ключевые данные', () => {
    const originalSnapshot: StoresSnapshot = {
      player: { name: 'Round', startAge: 22, currentAge: 28 },
      time: { totalHours: 777, sleepDebt: 4, startAge: 22 },
      stats: { energy: 65, health: 90, hunger: 55, stress: 30, mood: 70, physical: 60 },
      wallet: { money: 25000, totalEarned: 50000, totalSpent: 25000, reserveFund: 5000 },
      skills: { skills: { professionalism: 2 } },
    }

    const world: GameWorld = fromStores(originalSnapshot)

    const restored: StoresSnapshot = {}
    const loadTarget: StoresLoadTarget = {
      player: { load: (data) => { restored.player = data } },
      time: { load: (data) => { restored.time = data } },
      stats: { load: (data) => { restored.stats = data } },
      wallet: { load: (data) => { restored.wallet = data } },
      skills: { load: (data) => { restored.skills = data } },
    }

    applyToStores(world, loadTarget)

    expect(restored.player?.name).toBe('Round')
    expect(restored.player?.currentAge).toBe(28)
    expect(restored.time?.totalHours).toBe(777)
    expect(restored.time?.weekHoursSpent).toBe(777 % 168)
    expect(restored.time?.weekHoursRemaining).toBe(168 - (777 % 168))
    expect(restored.time?.dayHoursSpent).toBe(777 % 24)
    expect(restored.time?.dayHoursRemaining).toBe(24 - (777 % 24))
    expect(restored.stats?.energy).toBe(65)
    expect(restored.wallet?.money).toBe(25000)
    expect(restored.wallet?.totalEarned).toBe(50000)
    expect((restored.skills?.skills as Record<string, { level: number }>).professionalism?.level).toBe(2)
  })
})
