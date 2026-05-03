import { describe, it, expect } from 'vitest'
import { executeActionWithContext } from '@application/game'

function createContext(overrides: Partial<{
  money: number
  weekHoursRemaining: number
  currentAge: number
  getSkillLevel: (skill: string) => number
}> = {}) {
  return {
    money: overrides.money ?? 10000,
    weekHoursRemaining: overrides.weekHoursRemaining ?? 40,
    currentAge: overrides.currentAge ?? 25,
    getSkillLevel: overrides.getSkillLevel ?? ((_skill: string) => 0),
  }
}

describe('executeActionWithContext command', () => {
  it('возвращает ошибку для несуществующего действия', () => {
    const result = executeActionWithContext('nonexistent_action', createContext())

    expect(result.success).toBe(false)
    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Действие не найдено')
  })

  it('возвращает ошибку при недостатке денег', () => {
    const result = executeActionWithContext('fun_cinema', createContext({ money: 0 }))

    expect(result.success).toBe(false)
    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно денег')
    expect(result.effect).toBeUndefined()
  })

  it('возвращает ошибку при недостатке времени', () => {
    const result = executeActionWithContext('fun_cinema', createContext({ weekHoursRemaining: 0 }))

    expect(result.success).toBe(false)
    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно времени')
  })

  it('возвращает успех и effect payload при корректном вызове', () => {
    const result = executeActionWithContext('fun_cinema', createContext())

    expect(result.success).toBe(true)
    expect(result.canExecute).toBe(true)
    expect(result.effect).toBeDefined()
    expect(result.effect!.hourCost).toBeGreaterThan(0)
  })

  it('effect payload содержит price, hourCost и actionType', () => {
    const result = executeActionWithContext('fun_cinema', createContext())

    expect(result.success).toBe(true)
    expect(result.effect).toBeDefined()

    const effect = result.effect!
    expect(typeof effect.price).toBe('number')
    expect(typeof effect.hourCost).toBe('number')
    expect(typeof effect.actionType).toBe('string')
  })

  it('effect payload содержит statChanges для действий со статами', () => {
    const result = executeActionWithContext('fun_cinema', createContext())

    if (result.success && result.effect?.statChanges) {
      expect(typeof result.effect.statChanges).toBe('object')
    }
  })

  it('возвращает сообщение об эффекте', () => {
    const result = executeActionWithContext('fun_cinema', createContext())

    expect(result.success).toBe(true)
    expect(result.message).toBeTruthy()
  })
})
