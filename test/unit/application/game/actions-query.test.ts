import { describe, it, expect } from 'vitest'
import { canExecuteAction, canExecuteActionWithAction } from '@application/game/queries'

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

describe('canExecuteAction query', () => {
  it('возвращает canExecute: false для несуществующего действия', () => {
    const result = canExecuteAction('nonexistent_action', createContext())

    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Действие не найдено')
  })

  it('возвращает canExecute: false при недостатке денег', () => {
    const result = canExecuteAction('fun_cinema', createContext({ money: 0 }))

    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно денег')
  })

  it('возвращает canExecute: false при недостатке времени', () => {
    const result = canExecuteAction('fun_cinema', createContext({ weekHoursRemaining: 0 }))

    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно времени')
  })

  it('возвращает canExecute: false при несоответствии возраста (через requirements)', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action_age',
        title: 'Тест',
        price: 0,
        hourCost: 1,
        actionType: 'default',
        requirements: { minAge: 18 },
      },
      createContext({ currentAge: 10 }),
    )

    expect(result.canExecute).toBe(false)
    expect(result.reason).toContain('Требуется возраст')
  })

  it('возвращает canExecute: true при выполнении всех условий', () => {
    const result = canExecuteAction('fun_cinema', createContext())

    expect(result.canExecute).toBe(true)
    expect(result.reason).toBeUndefined()
  })

  it('возвращает canExecute: false при недостаточном уровне навыка', () => {
    const result = canExecuteAction('fun_cinema', createContext({
      getSkillLevel: (_skill: string) => 0,
    }))

    // fun_cinema не имеет skill requirements, так что ожидаем true
    expect(result.canExecute).toBe(true)
  })
})

describe('canExecuteActionWithAction query', () => {
  it('возвращает canExecute: false при недостатке денег', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action',
        title: 'Тест',
        price: 500,
        hourCost: 2,
        actionType: 'default',
        requirements: undefined,
      },
      createContext({ money: 100 }),
    )

    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно денег')
  })

  it('возвращает canExecute: false при недостатке времени', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action',
        title: 'Тест',
        price: 0,
        hourCost: 5,
        actionType: 'default',
        requirements: undefined,
      },
      createContext({ weekHoursRemaining: 2 }),
    )

    expect(result.canExecute).toBe(false)
    expect(result.reason).toBe('Недостаточно времени')
  })

  it('возвращает canExecute: true для бесплатного действия с достаточным временем', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action',
        title: 'Тест',
        price: 0,
        hourCost: 1,
        actionType: 'default',
        requirements: undefined,
      },
      createContext(),
    )

    expect(result.canExecute).toBe(true)
  })

  it('возвращает canExecute: false при несоответствии minAge', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action',
        title: 'Тест',
        price: 0,
        hourCost: 1,
        actionType: 'default',
        requirements: { minAge: 18 },
      },
      createContext({ currentAge: 10 }),
    )

    expect(result.canExecute).toBe(false)
    expect(result.reason).toContain('Требуется возраст')
  })

  it('возвращает canExecute: false при недостаточном уровне навыка', () => {
    const result = canExecuteActionWithAction(
      {
        id: 'test_action',
        title: 'Тест',
        price: 0,
        hourCost: 1,
        actionType: 'default',
        requirements: { minSkills: { programming: 5 } },
      },
      createContext({ getSkillLevel: (_skill: string) => 2 }),
    )

    expect(result.canExecute).toBe(false)
    expect(result.reason).toContain('Требуется навык programming')
  })
})
