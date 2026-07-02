import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import {
  calculateMonthlyReturnForWorld,
  divestFromWorld,
  investInWorld,
  processMonthlySettlementForWorld,
  repayDebtInWorld,
  setExpenseInWorld,
  takeDebtInWorld,
} from '@/domain/game-world/commands'

function createWorldWithMoney(money: number): GameWorld {
  return GameWorld.createEmpty({
    wallet: { money, totalEarnings: money, totalSpent: 0, reserveFund: 0 },
    finance: {
      reserveFund: 0,
      monthlyExpenses: {},
      lastMonthlySettlement: null,
      debt: 0,
      investments: [],
      expenseList: [
        { category: 'rent', amount: 10000 },
        { category: 'food', amount: 5000 },
      ],
    },
  })
}

describe('domain finance mutations', () => {
  it('investInWorld: списывает деньги и добавляет Investment', () => {
    const world: GameWorld = createWorldWithMoney(100000)

    const result: boolean = investInWorld(world, 'stocks', 50000, 10)

    expect(result).toBe(true)
    expect(world.wallet.money).toBe(50000)
    expect(world.finance.investments).toHaveLength(1)
    expect(world.finance.investments[0]?.type).toBe('stocks')
    expect(world.finance.investments[0]?.amount).toBe(50000)
  })

  it('investInWorld: отклоняет при нехватке денег', () => {
    const world: GameWorld = createWorldWithMoney(1000)

    const result: boolean = investInWorld(world, 'stocks', 50000, 10)

    expect(result).toBe(false)
    expect(world.finance.investments).toHaveLength(0)
    expect(world.wallet.money).toBe(1000)
  })

  it('divestFromWorld: возвращает деньги и удаляет инвестицию', () => {
    const world: GameWorld = createWorldWithMoney(100000)
    investInWorld(world, 'deposit', 30000, 5)
    const investmentId: string = world.finance.investments[0]!.id

    const amount: number = divestFromWorld(world, investmentId)

    expect(amount).toBe(30000)
    expect(world.wallet.money).toBe(100000)
    expect(world.finance.investments).toHaveLength(0)
  })

  it('divestFromWorld: возвращает 0 для неизвестного id', () => {
    const world: GameWorld = createWorldWithMoney(100000)

    const amount: number = divestFromWorld(world, 'unknown_id')

    expect(amount).toBe(0)
  })

  it('calculateMonthlyReturnForWorld: суммирует returns всех инвестиций', () => {
    const world: GameWorld = createWorldWithMoney(1_000_000)
    investInWorld(world, 'deposit', 120000, 12) // 120000 * 0.12 / 12 = 1200
    investInWorld(world, 'stocks', 60000, 24) // 60000 * 0.24 / 12 = 1200

    const monthly: number = calculateMonthlyReturnForWorld(world)

    expect(monthly).toBeCloseTo(2400, 2)
  })

  it('processMonthlySettlementForWorld: начисляет returns, списывает expenses, обновляет timestamp', () => {
    const world: GameWorld = createWorldWithMoney(100000)
    investInWorld(world, 'deposit', 120000, 12) // но денег 100к → не пройдёт. Увеличим:
    const world2: GameWorld = createWorldWithMoney(500000)
    investInWorld(world2, 'deposit', 120000, 12) // returns: 1200

    processMonthlySettlementForWorld(world2)

    // money = 380000 + 1200 (returns) - 10000 (rent) - 5000 (food) = 366200
    expect(world2.wallet.money).toBe(366200)
    expect(world2.finance.lastMonthlySettlement).not.toBeNull()
  })

  it('setExpenseInWorld: обновляет существующий expense', () => {
    const world: GameWorld = createWorldWithMoney(100000)

    setExpenseInWorld(world, 'rent', 25000)

    expect(world.finance.expenseList.find((e) => e.category === 'rent')?.amount).toBe(25000)
    expect(world.finance.monthlyExpenses.rent).toBe(25000)
  })

  it('setExpenseInWorld: добавляет новый expense', () => {
    const world: GameWorld = createWorldWithMoney(100000)

    setExpenseInWorld(world, 'entertainment', 3000)

    expect(world.finance.expenseList.some((e) => e.category === 'entertainment')).toBe(true)
    expect(world.finance.monthlyExpenses.entertainment).toBe(3000)
  })

  it('takeDebtInWorld: увеличивает debt и пополняет кошелёк', () => {
    const world: GameWorld = createWorldWithMoney(0)

    takeDebtInWorld(world, 50000)

    expect(world.finance.debt).toBe(50000)
    expect(world.wallet.money).toBe(50000)
  })

  it('repayDebtInWorld: списывает деньги и уменьшает debt (не ниже 0)', () => {
    const world: GameWorld = createWorldWithMoney(100000)
    takeDebtInWorld(world, 50000) // debt 50000, money 150000

    repayDebtInWorld(world, 30000)

    expect(world.finance.debt).toBe(20000)
    expect(world.wallet.money).toBe(120000)
  })

  it('repayDebtInWorld: не уходит в минус при переплате', () => {
    const world: GameWorld = createWorldWithMoney(100000)
    takeDebtInWorld(world, 10000)

    repayDebtInWorld(world, 50000)

    expect(world.finance.debt).toBe(0)
    expect(world.wallet.money).toBe(100000)
  })
})
