import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import { FINANCE_ACTIONS } from '@/domain/engine/systems/FinanceActionSystem/index.constants'

describe('Finance catalog contract', () => {
  function createSystem(): { world: ReturnType<typeof createWorldFromSave>; finance: FinanceActionSystem } {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const finance = new FinanceActionSystem()
    finance.init(world)
    return { world, finance }
  }

  test('every FINANCE_ACTIONS entry resolves in applyFinanceAction', () => {
    for (const action of FINANCE_ACTIONS) {
      // Изолируем каждое действие в отдельном мире, чтобы исключить
      // накопление side-effects (время/деньги) между итерациями.
      const { world, finance } = createSystem()
      const wallet = world.getComponent('player', 'wallet') as Record<string, number>
      const time = world.getComponent('player', 'time') as Record<string, number>
      wallet.money = 200000
      time.totalHours = 0
      time.weekHoursRemaining = 168

      const result = finance.applyFinanceAction(action.id)
      expect(result.success, `Action "${action.id}" should resolve (got: ${result.message})`).toBe(true)
    }
  })

  test('getFinanceActions returns all actions from catalog', () => {
    const { finance } = createSystem()
    const actions = finance.getFinanceActions()
    expect(actions.length).toBe(FINANCE_ACTIONS.length)
    const ids = actions.map(a => a.id).sort()
    const expectedIds = FINANCE_ACTIONS.map(a => a.id).sort()
    expect(ids).toEqual(expectedIds)
  })

  test('unknown action ID returns error', () => {
    const { finance } = createSystem()
    const result = finance.applyFinanceAction('nonexistent_action')
    expect(result.success).toBe(false)
    expect(result.message).toContain('не найдено')
  })

  test('all finance actions have required fields', () => {
    for (const action of FINANCE_ACTIONS) {
      expect(action.id, 'Action must have id').toBeTruthy()
      expect(action.title, `Action "${action.id}" must have title`).toBeTruthy()
      expect(typeof action.amount, `Action "${action.id}" amount must be number`).toBe('number')
      expect(typeof action.hourCost, `Action "${action.id}" hourCost must be number`).toBe('number')
    }
  })

  test('pay_off_small_debt deducts money', () => {
    const { world, finance } = createSystem()
    // Даём игроку достаточно денег
    const wallet = world.getComponent('player', 'wallet') as Record<string, number>
    wallet.money = 50000
    const moneyBefore = wallet.money

    const result = finance.applyFinanceAction('pay_off_small_debt')
    expect(result.success).toBe(true)
    expect(wallet.money).toBeLessThan(moneyBefore)
  })

  test('sell_unnecessary_items adds money from sale', () => {
    const { world, finance } = createSystem()
    const wallet = world.getComponent('player', 'wallet') as Record<string, number>
    const moneyBefore = wallet.money

    const result = finance.applyFinanceAction('sell_unnecessary_items')
    expect(result.success).toBe(true)
    expect(wallet.money).toBeGreaterThan(moneyBefore)
  })
})
