import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { LifeMemorySystem } from '@/domain/engine/systems/LifeMemorySystem'
import type { LifeMemoryComponent } from '@/domain/balance/types/life-memory'

describe('domain/childhood life memory', () => {
  test('initial save has empty life_memory component', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory' })
    const component = world.getComponent<LifeMemoryComponent>('player', 'life_memory')

    expect(component).toBeTruthy()
    expect(component!.memories).toEqual([])
    expect(component!.childhoodScore).toBe(0)
  })

  test('recordMemory adds entry', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 5 })
    const system = new LifeMemorySystem()
    system.init(world)

    const entry = system.recordMemory({
      id: 'mem_test_1',
      age: 5,
      summary: 'Первый день в садике',
      emotionalWeight: 30,
      tags: ['preschool', 'social'],
      sourceEventId: 'event_1',
      active: true,
    })

    expect(entry.gameDay).toBe(0) // Начальный gameDay = 0
    expect(entry.id).toBe('mem_test_1')

    const memories = system.getMemories()
    expect(memories).toHaveLength(1)
  })

  test('getMemories filters by tag', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 5 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_1', age: 5, summary: 'Событие 1', emotionalWeight: 20,
      tags: ['social'], active: true,
    })
    system.recordMemory({
      id: 'mem_2', age: 5, summary: 'Событие 2', emotionalWeight: -10,
      tags: ['health'], active: true,
    })
    system.recordMemory({
      id: 'mem_3', age: 5, summary: 'Событие 3', emotionalWeight: 40,
      tags: ['social', 'school'], active: true,
    })

    const social = system.getMemories({ tag: 'social' })
    expect(social).toHaveLength(2)

    const health = system.getMemories({ tag: 'health' })
    expect(health).toHaveLength(1)
  })

  test('getMemories filters by age range', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 10 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_1', age: 3, summary: 'Возраст 3', emotionalWeight: 10,
      tags: [], active: true,
    })
    system.recordMemory({
      id: 'mem_2', age: 8, summary: 'Возраст 8', emotionalWeight: 20,
      tags: [], active: true,
    })
    system.recordMemory({
      id: 'mem_3', age: 15, summary: 'Возраст 15', emotionalWeight: -5,
      tags: [], active: true,
    })

    const filtered = system.getMemories({ minAge: 5, maxAge: 12 })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe('mem_2')
  })

  test('childhoodScore is average of memories before age 18', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 10 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_1', age: 5, summary: 'Хорошее', emotionalWeight: 60,
      tags: [], active: true,
    })
    system.recordMemory({
      id: 'mem_2', age: 10, summary: 'Плохое', emotionalWeight: -40,
      tags: [], active: true,
    })

    // (60 + (-40)) / 2 = 10
    expect(system.getChildhoodScore()).toBe(10)
  })

  test('hasMemory checks by id', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 5 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_unique_1', age: 5, summary: 'Уникальное', emotionalWeight: 0,
      tags: [], active: true,
    })

    expect(system.hasMemory('mem_unique_1')).toBe(true)
    expect(system.hasMemory('nonexistent')).toBe(false)
  })

  test('deactivateMemory marks memory as inactive', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 5 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_deactivate', age: 5, summary: 'Деактивировать', emotionalWeight: 0,
      tags: [], active: true,
    })

    expect(system.deactivateMemory('mem_deactivate')).toBe(true)

    const memory = system.getMemoryById('mem_deactivate')
    expect(memory!.active).toBe(false)
  })

  test('getMemories filters by activeOnly', () => {
    const world = createWorldFromSave({ playerName: 'TestMemory', currentAge: 5 })
    const system = new LifeMemorySystem()
    system.init(world)

    system.recordMemory({
      id: 'mem_active', age: 5, summary: 'Активное', emotionalWeight: 0,
      tags: [], active: true,
    })
    system.recordMemory({
      id: 'mem_inactive', age: 5, summary: 'Неактивное', emotionalWeight: 0,
      tags: [], active: false,
    })

    const active = system.getMemories({ activeOnly: true })
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe('mem_active')
  })
})
