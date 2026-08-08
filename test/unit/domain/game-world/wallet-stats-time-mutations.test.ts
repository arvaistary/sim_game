import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  addMoneyInWorld,
  advanceHours,
  advanceHoursWithSleepInWorld,
  applyStatChanges,
  earnMoney,
  reduceSleepDebtInWorld,
  restoreAllStatsInWorld,
  setEnergyInWorld,
  setMoneyInWorld,
  setStatsInWorld,
  setTotalHoursInWorld,
  spendMoney,
  executeActionCommand,
  transferFromReserveInWorld,
  transferToReserveInWorld,
} from '@/domain/game-world/commands'

describe('domain wallet mutations', () => {
  it('earnMoney/spendMoney: корректно обновляют money и totals', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 1000, totalEarnings: 1000, totalSpent: 0, reserveFund: 0 } })

    earnMoney(world, 500)
    expect(world.wallet.money).toBe(1500)
    expect(world.wallet.totalEarnings).toBe(1500)

    spendMoney(world, 300)
    expect(world.wallet.money).toBe(1200)
    expect(world.wallet.totalSpent).toBe(300)
  })

  it('spendMoney: возвращает false при нехватке', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 100, totalEarnings: 100, totalSpent: 0, reserveFund: 0 } })

    expect(spendMoney(world, 500)).toBe(false)
    expect(world.wallet.money).toBe(100)
  })

  it('transferToReserveInWorld: переводит из money в reserveFund', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 1000, totalEarnings: 1000, totalSpent: 0, reserveFund: 0 } })

    transferToReserveInWorld(world, 400)

    expect(world.wallet.money).toBe(600)
    expect(world.wallet.reserveFund).toBe(400)
  })

  it('transferToReserveInWorld: не уходит в минус', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 100, totalEarnings: 100, totalSpent: 0, reserveFund: 0 } })

    transferToReserveInWorld(world, 500)

    expect(world.wallet.money).toBe(0)
    expect(world.wallet.reserveFund).toBe(100)
  })

  it('transferFromReserveInWorld: переводит из reserveFund в money', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 0, totalEarnings: 0, totalSpent: 0, reserveFund: 500 } })

    transferFromReserveInWorld(world, 200)

    expect(world.wallet.money).toBe(200)
    expect(world.wallet.reserveFund).toBe(300)
  })

  it('setMoneyInWorld: clamp к 0..999_999_999', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setMoneyInWorld(world, -100)
    expect(world.wallet.money).toBe(0)

    setMoneyInWorld(world, 1_000_000_000_000)
    expect(world.wallet.money).toBe(999_999_999)
  })

  it('addMoneyInWorld: добавляет с clamp', () => {
    const world: GameWorld = GameWorld.createEmpty({ wallet: { money: 100, totalEarnings: 100, totalSpent: 0, reserveFund: 0 } })

    addMoneyInWorld(world, 500)

    expect(world.wallet.money).toBe(600)
  })
})

describe('domain stats mutations', () => {
  it('applyStatChanges: применяет Partial изменения', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const energyBefore: number = world.stats.energy

    applyStatChanges(world, { energy: -10, mood: 5 })

    expect(world.stats.energy).toBe(energyBefore - 10)
    expect(world.stats.mood).toBeGreaterThan(0)
  })

  it('applyStatChanges: игнорирует undefined поля', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const energyBefore: number = world.stats.energy

    applyStatChanges(world, { energy: -5, mood: undefined })

    expect(world.stats.energy).toBe(energyBefore - 5)
  })

  it('setStatsInWorld: устанавливает статы с clamp', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setStatsInWorld(world, { energy: 150, hunger: -20 })

    expect(world.stats.energy).toBe(100)
    expect(world.stats.hunger).toBe(0)
  })

  it('setEnergyInWorld: clamp к 0..100', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setEnergyInWorld(world, 150)
    expect(world.stats.energy).toBe(100)

    setEnergyInWorld(world, -10)
    expect(world.stats.energy).toBe(0)
  })

  it('restoreAllStatsInWorld: восстанавливает к полным', () => {
    const world: GameWorld = GameWorld.createEmpty({ stats: { hunger: 80, energy: 20, stress: 70, mood: 10, health: 30, physical: 10 } })

    restoreAllStatsInWorld(world)

    expect(world.stats.energy).toBe(100)
    expect(world.stats.health).toBe(100)
    expect(world.stats.mood).toBe(100)
    expect(world.stats.hunger).toBe(0)
    expect(world.stats.stress).toBe(0)
  })
})

describe('domain time mutations', () => {
  it('advanceHours: derives day/week budgets from totalHours after 168+ hours', async () => {
    const { advanceHours } = await import('@/domain/game-world/commands')
    const world: GameWorld = GameWorld.createEmpty()

    advanceHours(world, 169)

    expect(world.time.totalHours).toBe(169)
    expect(world.time.weekHoursSpent).toBe(1)
    expect(world.time.weekHoursRemaining).toBe(167)
    expect(world.time.dayHoursSpent).toBe(1)
    expect(world.time.dayHoursRemaining).toBe(23)
  })

  it('restores a full daily and weekly budget at an exact period boundary', () => {
    const world: GameWorld = GameWorld.createEmpty()

    advanceHours(world, 168)

    expect(world.time.weekHoursSpent).toBe(0)
    expect(world.time.weekHoursRemaining).toBe(168)
    expect(world.time.dayHoursSpent).toBe(0)
    expect(world.time.dayHoursRemaining).toBe(24)
  })

  it('blocks an action when the derived weekly budget is exhausted', () => {
    const world: GameWorld = GameWorld.createEmpty()

    advanceHours(world, 167)
    const result = executeActionCommand(world, 'fun_park_walk')

    expect(result).toEqual({ success: false, message: 'Недостаточно времени' })
    expect(world.time.totalHours).toBe(167)
  })

  it('does not mutate a rejected action with an unmet education prerequisite', () => {
    const world: GameWorld = GameWorld.createEmpty()
    const before: ReturnType<GameWorld['toJSON']> = world.toJSON()

    const result = executeActionCommand(world, 'self_meditation_practice')

    expect(result).toEqual({ success: false, message: 'Сначала завершите книгу «Основы медитации»' })
    expect(world.toJSON()).toEqual(before)
  })

  it('advanceHoursWithSleepInWorld: увеличивает totalHours и списывает sleepDebt', () => {
    const world: GameWorld = GameWorld.createEmpty({ time: { totalHours: 0, hourOfDay: 0, dayOfWeek: 1, weekHoursSpent: 0, weekHoursRemaining: 168, dayHoursSpent: 0, dayHoursRemaining: 24, sleepHoursToday: 0, sleepDebt: 50 } })

    advanceHoursWithSleepInWorld(world, 8, 8)

    expect(world.time.totalHours).toBe(8)
    expect(world.time.sleepDebt).toBe(50 - 16) // 50 - 8*2
  })

  it('reduceSleepDebtInWorld: clamp к 0', () => {
    const world: GameWorld = GameWorld.createEmpty({ time: { totalHours: 0, hourOfDay: 0, dayOfWeek: 1, weekHoursSpent: 0, weekHoursRemaining: 168, dayHoursSpent: 0, dayHoursRemaining: 24, sleepHoursToday: 0, sleepDebt: 20 } })

    reduceSleepDebtInWorld(world, 100)

    expect(world.time.sleepDebt).toBe(0)
  })

  it('setTotalHoursInWorld: устанавливает totalHours', () => {
    const world: GameWorld = GameWorld.createEmpty()

    setTotalHoursInWorld(world, 500)

    expect(world.time.totalHours).toBe(500)
  })
})
