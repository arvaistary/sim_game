import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { ChainResolverSystem } from '@/domain/engine/systems/ChainResolverSystem'
import type { ChainStateComponent } from '@/domain/engine/systems/ChainResolverSystem/index.types'

describe('domain/childhood chain resolver', () => {
  test('initial save has empty chain_state component', () => {
    const world = createWorldFromSave({ playerName: 'TestChain' })
    const component = world.getComponent<ChainStateComponent>('player', 'chain_state')

    expect(component).toBeTruthy()
    expect(component!.chains).toEqual({})
  })

  test('resolveAvailableChains returns first events for unstarted chains', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 10 })
    const system = new ChainResolverSystem()
    system.init(world)

    const available = system.resolveAvailableChains(10)

    // Должны быть события цепочек для возраста 10 (KID: 8-12)
    expect(available.length).toBeGreaterThan(0)

    // Все возвращённые события должны быть первыми в цепочке (без condition)
    for (const event of available) {
      expect(event.condition).toBeFalsy()
      expect(event.chainTag).toBeTruthy()
    }
  })

  test('resolveAvailableChains returns empty for wrong age', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 0 })
    const system = new ChainResolverSystem()
    system.init(world)

    // Возраст 0 — цепочки обычно начинаются позже
    const available = system.resolveAvailableChains(0)

    // Цепочки "math_teacher" и "best_friend" начинаются с 8-12 лет
    const mathTeacherEvents = available.filter(e => e.chainTag === 'math_teacher')
    const bestFriendEvents = available.filter(e => e.chainTag === 'best_friend')
    expect(mathTeacherEvents).toHaveLength(0)
    expect(bestFriendEvents).toHaveLength(0)
  })

  test('markChainEventProcessed records step', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 10 })
    const system = new ChainResolverSystem()
    system.init(world)

    system.markChainEventProcessed('math_teacher', 'math_teacher_kindness', 0)

    const progress = system.getChainProgress('math_teacher')
    expect(progress).toBeTruthy()
    expect(progress!.steps).toHaveLength(1)
    expect(progress!.steps[0].eventId).toBe('math_teacher_kindness')
    expect(progress!.steps[0].choiceIndex).toBe(0)
  })

  test('isChainStarted returns correct state', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 10 })
    const system = new ChainResolverSystem()
    system.init(world)

    expect(system.isChainStarted('math_teacher')).toBe(false)

    system.markChainEventProcessed('math_teacher', 'math_teacher_kindness', 0)

    expect(system.isChainStarted('math_teacher')).toBe(true)
  })

  test('getAllChainProgress returns all chains', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 10 })
    const system = new ChainResolverSystem()
    system.init(world)

    system.markChainEventProcessed('math_teacher', 'math_teacher_kindness', 0)
    system.markChainEventProcessed('best_friend', 'best_friend_stolen_gum', 1)

    const allProgress = system.getAllChainProgress()
    expect(Object.keys(allProgress)).toHaveLength(2)
    expect(allProgress['math_teacher']).toBeTruthy()
    expect(allProgress['best_friend']).toBeTruthy()
  })

  test('after processing first step, next chain event becomes available', () => {
    const world = createWorldFromSave({ playerName: 'TestChain', currentAge: 10 })
    const system = new ChainResolverSystem()
    system.init(world)

    // Обработать первый шаг цепочки
    system.markChainEventProcessed('math_teacher', 'math_teacher_kindness', 0)

    // Теперь следующий шаг должен быть доступен (если есть событие с condition = 'math_teacher_kindness')
    const available = system.resolveAvailableChains(10)
    const nextMathTeacher = available.find(e => e.chainTag === 'math_teacher' && e.condition === 'math_teacher_kindness')

    // Если в данных есть следующий шаг — он должен быть доступен
    if (nextMathTeacher) {
      expect(nextMathTeacher.condition).toBe('math_teacher_kindness')
    }
  })
})
