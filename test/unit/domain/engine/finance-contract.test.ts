import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { FinanceActionSystem } from '@/domain/engine/systems/FinanceActionSystem'
import { getActionsByCategory } from '@/domain/balance/actions'

describe('Finance catalog contract', () => {
  function createSystem(): { world: ReturnType<typeof createWorldFromSave>; finance: FinanceActionSystem } {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const finance = new FinanceActionSystem()
    finance.init(world)
    return { world, finance }
  }

  const financeActions = getActionsByCategory('finance')

  test('every finance action resolves in applyFinanceAction', () => {
    for (const action of financeActions) {
      // Изолируем каждое действие в отдельном мире, чтобы исключить
      // накопление side-effects (время/деньги) между итерациями.
      const { world, finance } = createSystem()
      const wallet = world.getComponent('player', 'wallet') as Record<string, number>
      const time = world.getComponent('player', 'time') as Record<string, number>
      const financeComp = world.getComponent('player', 'finance') as Record<string, unknown>
      const housing = world.getComponent('player', 'housing') as Record<string, unknown>
      wallet.money = 1000000 // Increased for realty purchases
      time.totalHours = 0
      time.weekHoursRemaining = 168
      time.currentAge = 19 // Set age to 19 for age-restricted actions

      // Set up prerequisites for conditional actions
      if (action.id === 'fin_pay_debt') {
        financeComp.debt = 10000 // Set debt to allow paying it off
      }
      if (action.id === 'fin_pay_mortgage') {
        financeComp.monthlyExpenses = { credit_payment: 15000 } // Set mortgage
      }
      if (action.id === 'fin_rent_out') {
        housing.level = 2 // Set housing level for renting
      }

      const result = finance.applyFinanceAction(action.id)
      expect(result.success, `Action "${action.id}" should resolve (got: ${result.message})`).toBe(true)
    }
  })

  test('getFinanceActions returns all actions from catalog', () => {
    const { finance } = createSystem()
    const actions = finance.getFinanceActions()
    expect(actions.length).toBe(financeActions.length)
    const ids = actions.map(a => a.id).sort()
    const expectedIds = financeActions.map(a => a.id).sort()
    expect(ids).toEqual(expectedIds)
  })

  test('unknown action ID returns error', () => {
    const { finance } = createSystem()
    const result = finance.applyFinanceAction('nonexistent_action')
    expect(result.success).toBe(false)
    expect(result.message).toContain('не найдено')
  })

  test('all finance actions have required fields', () => {
    for (const action of financeActions) {
      expect(action.id, 'Action must have id').toBeTruthy()
      expect(action.title, `Action "${action.id}" must have title`).toBeTruthy()
      expect(typeof action.price, `Action "${action.id}" price must be number`).toBe('number')
      expect(typeof action.hourCost, `Action "${action.id}" hourCost must be number`).toBe('number')
    }
  })

  test('fin_pay_debt deducts money', () => {
    const { world, finance } = createSystem()
    // Даём игроку достаточно денег
    const wallet = world.getComponent('player', 'wallet') as Record<string, number>
    const time = world.getComponent('player', 'time') as Record<string, number>
    const financeComp = world.getComponent('player', 'finance') as Record<string, unknown>
    wallet.money = 50000
    time.currentAge = 19 // Set age to 19 for age-restricted actions
    financeComp.debt = 10000 // Set debt to allow paying it off
    const moneyBefore = wallet.money

    const result = finance.applyFinanceAction('fin_pay_debt')
    expect(result.success).toBe(true)
    expect(wallet.money).toBeLessThan(moneyBefore)
  })
})
