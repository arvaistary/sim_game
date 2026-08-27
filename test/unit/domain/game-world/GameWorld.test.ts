import { describe, expect, it } from 'vitest'
import { GameWorld, GAME_WORLD_VERSION } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'

function buildSampleSnapshot(): GameWorldSnapshot {
  return {
    player: { playerName: 'Тест', startAge: 20, currentAge: 25 },
    time: {
      totalHours: 1000,
      hourOfDay: 12,
      dayOfWeek: 3,
      weekHoursSpent: 40,
      weekHoursRemaining: 128,
      dayHoursSpent: 8,
      dayHoursRemaining: 16,
      sleepHoursToday: 7,
      sleepDebt: 5,
    },
    stats: { hunger: 60, energy: 80, stress: 30, mood: 70, health: 90, physical: 55 },
    wallet: { money: 50000, totalEarnings: 100000, totalSpent: 50000, reserveFund: 20000 },
    career: {
      currentJob: {
        id: 'job_test',
        name: 'Тестер',
        schedule: '5/2',
        employed: true,
        salaryPerHour: 500,
        salaryPerWeek: 20000,
        salaryPerDay: 4000,
        requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 10,
        pendingSalaryWeek: 0,
        totalWorkedHours: 500,
        level: 2,
        daysAtWork: 50,
      },
      jobHistory: [],
      careerLevel: 2,
      promotions: 0,
    },
    housing: {
      level: 1,
      name: 'Студия',
      comfort: 40,
      furniture: [],
      lastWeeklyBonus: null,
    },
    skills: {
      levels: { professionalism: { level: 3, xp: 350 }, communication: { level: 2, xp: 150 } },
      modifiers: {
        hungerDrainMultiplier: 1,
        energyDrainMultiplier: 1,
        stressGainMultiplier: 1,
        moodRecoveryMultiplier: 1,
        healthDecayMultiplier: 1,
        salaryMultiplier: 1.1,
        workEfficiencyMultiplier: 1,
        shopPriceMultiplier: 1,
        investmentReturnMultiplier: 1,
        learningSpeedMultiplier: 1,
        homeComfortMultiplier: 1,
        dailyExpenseMultiplier: 1,
        positiveEventChanceBonus: 0,
        negativeEventPenaltyReduction: 0,
        relationshipGainMultiplier: 1,
        hobbyIncomeMultiplier: 1,
        passiveIncomeBonus: 0,
        maxEnergyBonus: 0,
        agingSpeedMultiplier: 1,
        foodRecoveryMultiplier: 1,
        promotionChanceBonus: 0,
        allRecoveryMultiplier: 1,
        healthRecoveryMultiplier: 1,
        eventChoiceHintBonus: 0,
        autoRecoveryWeekly: 0,
      },
    },
    education: {
      school: 'completed',
      institute: 'none',
      educationLevel: 'Среднее',
      activeCourses: [],
      completedPrograms: [],
    },
    relationships: [
      { id: 'friend_1', name: 'Иван', type: 'friend', level: 50, lastContact: 100 },
    ],
    finance: {
      reserveFund: 20000,
      monthlyExpenses: { housing: 15000 },
      lastMonthlySettlement: null,
      debt: 0,
      investments: [],
      expenseList: [{ category: 'housing', amount: 15000 }],
    },
    events: {
      state: {
        cooldownByEventId: { event_1: 100 },
        lastWeeklyEventWeek: 5,
        lastMonthlyEventMonth: 2,
        lastYearlyEventYear: 0,
      },
      history: [],
      pending: [],
    },
    activity: {
      entries: [],
      lifetime: {
        totalWorkDays: 10,
        totalWorkHours: 500,
        totalEvents: 5,
        totalMicroEvents: 2,
        maxMoney: 50000,
      },
    },
    tags: { items: [] },
  }
}

describe('GameWorld skeleton', () => {
  it('создаётся из snapshot и предоставляет доступ к slice-геттерам', () => {
    const snapshot: GameWorldSnapshot = buildSampleSnapshot()
    const world: GameWorld = new GameWorld(snapshot)

    expect(world.player.playerName).toBe('Тест')
    expect(world.player.currentAge).toBe(25)
    expect(world.time.totalHours).toBe(1000)
    expect(world.time.sleepDebt).toBe(5)
    expect(world.stats.energy).toBe(80)
    expect(world.wallet.money).toBe(50000)
    expect(world.career.currentJob.id).toBe('job_test')
    expect(world.housing.level).toBe(1)
    expect(world.skills.levels.professionalism?.level).toBe(3)
    expect(world.skills.modifiers.salaryMultiplier).toBe(1.1)
    expect(world.relationships).toHaveLength(1)
    expect(world.finance.reserveFund).toBe(20000)
    expect(world.events.state.lastWeeklyEventWeek).toBe(5)
    expect(world.activity.lifetime.totalWorkHours).toBe(500)
  })

  it('не мутирует исходный snapshot (deep copy в constructor)', () => {
    const snapshot: GameWorldSnapshot = buildSampleSnapshot()
    const world: GameWorld = new GameWorld(snapshot)

    world.player.currentAge = 99
    world.wallet.money = 0

    expect(snapshot.player.currentAge).toBe(25)
    expect(snapshot.wallet.money).toBe(50000)
  })
})

describe('GameWorld serialization', () => {
  it('toJSON возвращает объект с version-полем', () => {
    const world: GameWorld = new GameWorld(buildSampleSnapshot())
    const json: GameWorldJSON = world.toJSON()

    expect(json.version).toBe(GAME_WORLD_VERSION)
  })

  it('round-trip toJSON → fromJSON сохраняет все поля', () => {
    const original: GameWorld = new GameWorld(buildSampleSnapshot())
    original.meta.livesCompleted = 2
    original.meta.unlockedAchievements.push('first_job')
    const json: GameWorldJSON = original.toJSON()
    const restored: GameWorld = GameWorld.fromJSON(json)

    expect(restored.player).toEqual(original.player)
    expect(restored.time).toEqual(original.time)
    expect(restored.stats).toEqual(original.stats)
    expect(restored.wallet).toEqual(original.wallet)
    expect(restored.career).toEqual(original.career)
    expect(restored.housing).toEqual(original.housing)
    expect(restored.skills).toEqual(original.skills)
    expect(restored.education).toEqual(original.education)
    expect(restored.relationships).toEqual(original.relationships)
    expect(restored.finance).toEqual(original.finance)
    expect(restored.events).toEqual(original.events)
    expect(restored.activity).toEqual(original.activity)
    expect(restored.tags).toEqual(original.tags)
    expect(restored.meta).toEqual(original.meta)
  })

  it('toJSON не делится ссылками с world (immutable snapshot)', () => {
    const world: GameWorld = new GameWorld(buildSampleSnapshot())
    const json1: GameWorldJSON = world.toJSON()
    const json2: GameWorldJSON = world.toJSON()

    json1.player.currentAge = 999
    json1.wallet.money = -1

    expect(json2.player.currentAge).toBe(25)
    expect(json2.wallet.money).toBe(50000)
    expect(world.player.currentAge).toBe(25)
  })

  it('fromJSON не зависит от исходного JSON-объекта', () => {
    const original: GameWorld = new GameWorld(buildSampleSnapshot())
    const json: GameWorldJSON = original.toJSON()
    const restored: GameWorld = GameWorld.fromJSON(json)

    json.player.playerName = 'ВЗЛОМАНО'
    json.wallet.money = 999999

    expect(restored.player.playerName).toBe('Тест')
    expect(restored.wallet.money).toBe(50000)
  })

  it('toSnapshot возвращает структуру без version', () => {
    const world: GameWorld = new GameWorld(buildSampleSnapshot())
    const snapshot: GameWorldSnapshot = world.toSnapshot()

    expect('version' in snapshot).toBe(false)
    expect(snapshot.player.playerName).toBe('Тест')
  })
})

describe('GameWorld.createEmpty', () => {
  it('создаёт валидный пустой мир с разумными дефолтами', () => {
    const world: GameWorld = GameWorld.createEmpty()

    expect(world.player.playerName).toBe('')
    expect(world.player.startAge).toBe(18)
    expect(world.time.totalHours).toBe(0)
    expect(world.time.sleepDebt).toBe(0)
    expect(world.stats.energy).toBeGreaterThan(0)
    expect(world.wallet.money).toBe(0)
    expect(world.career.currentJob.employed).toBe(false)
    expect(world.housing.level).toBe(0)
    expect(Object.keys(world.skills.levels)).toHaveLength(0)
    expect(world.skills.modifiers.salaryMultiplier).toBe(1)
    expect(world.relationships).toHaveLength(0)
    expect(world.activity.entries).toHaveLength(0)
    expect(world.meta.livesCompleted).toBe(0)
  })

  it('принимает partial overrides', () => {
    const world: GameWorld = GameWorld.createEmpty({
      player: { playerName: 'Кастом', startAge: 25, currentAge: 30 },
      wallet: { money: 1000, totalEarnings: 1000, totalSpent: 0, reserveFund: 0 },
    })

    expect(world.player.playerName).toBe('Кастом')
    expect(world.player.currentAge).toBe(30)
    expect(world.wallet.money).toBe(1000)
  })

  it('round-trip createEmpty → toJSON → fromJSON стабилен', () => {
    const original: GameWorld = GameWorld.createEmpty()
    const json: GameWorldJSON = original.toJSON()
    const restored: GameWorld = GameWorld.fromJSON(json)

    expect(restored.toJSON()).toEqual(json)
  })
})
