import { describe, expect, test, beforeEach } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { StatsSystem } from '@/domain/engine/systems/StatsSystem'
import { telemetryReset, telemetryGetCounters } from '@/domain/engine/utils/telemetry'

describe('StatsSystem', () => {
  function createSystem(): { world: ReturnType<typeof createWorldFromSave>; stats: StatsSystem } {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const stats = new StatsSystem()
    stats.init(world)
    return { world, stats }
  }

  beforeEach(() => {
    telemetryReset()
  })

  describe('applyStatChanges', () => {
    test('применяет положительные изменения статов', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 50, mood: 30 })
      stats.applyStatChanges({ health: 10, mood: 5 })
      const result = stats.getStats()
      expect(result?.health).toBe(60)
      expect(result?.mood).toBe(35)
    })

    test('применяет отрицательные изменения статов', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 80, stress: 20 })
      stats.applyStatChanges({ health: -15, stress: 10 })
      const result = stats.getStats()
      expect(result?.health).toBe(65)
      expect(result?.stress).toBe(30)
    })

    test('clamp значения в пределах 0-100', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 50 })
      stats.applyStatChanges({ health: 100 }) // должно быть clamped до 100
      expect(stats.getStats()?.health).toBe(100)

      stats.applyStatChanges({ health: -200 }) // должно быть clamped до 0
      expect(stats.getStats()?.health).toBe(0)
    })

    test('игнорирует undefined значения', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 50 })
      stats.applyStatChanges({ health: undefined, mood: 10 })
      const result = stats.getStats()
      expect(result?.health).toBe(50) // не изменился
      expect(result?.mood).toBe(10) // добавился
    })

    test('записывает telemetry для каждого изменения стата', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 50, mood: 30 })
      stats.applyStatChanges({ health: 10, mood: -5 })
      const counters = telemetryGetCounters()
      expect(counters['stat_change:health']).toBe(10)
      expect(counters['stat_change:mood']).toBe(-5)
    })

    test('не падает при отсутствии stats компонента', () => {
      const { stats } = createSystem()
      // Удаляем stats компонент
      expect(() => stats.applyStatChanges({ health: 10 })).not.toThrow()
    })
  })

  describe('getStats', () => {
    test('возвращает копию stats компонента', () => {
      const { world, stats } = createSystem()
      world.updateComponent('player', 'stats', { health: 75, mood: 60 })
      const result = stats.getStats()
      expect(result).toEqual({ health: 75, mood: 60 })
    })

    test('возвращает null при отсутствии stats компонента', () => {
      const { stats } = createSystem()
      const result = stats.getStats()
      expect(result).toBeNull()
    })
  })

  describe('mergeStatChanges', () => {
    test('объединяет несколько наборов изменений', () => {
      const { stats } = createSystem()
      const result = stats.mergeStatChanges(
        { health: 10, mood: 5 },
        { health: -5, stress: 10 },
        { mood: 10 }
      )
      expect(result).toEqual({ health: 5, mood: 15, stress: 10 })
    })

    test('игнорирует null и undefined chunks', () => {
      const { stats } = createSystem()
      const result = stats.mergeStatChanges(
        { health: 10 },
        null,
        undefined,
        { mood: 5 }
      )
      expect(result).toEqual({ health: 10, mood: 5 })
    })

    test('возвращает пустой объект при отсутствии chunks', () => {
      const { stats } = createSystem()
      const result = stats.mergeStatChanges()
      expect(result).toEqual({})
    })

    test('игнорирует undefined значения внутри chunks', () => {
      const { stats } = createSystem()
      const result = stats.mergeStatChanges(
        { health: 10, mood: undefined },
        { health: undefined, stress: 5 }
      )
      expect(result).toEqual({ health: 10, stress: 5 })
    })
  })

  describe('summarizeStatChanges', () => {
    test('возвращает строку с описанием изменений', () => {
      const { stats } = createSystem()
      const result = stats.summarizeStatChanges({ health: 10, mood: -5 })
      expect(typeof result).toBe('string')
      expect(result.length).toBeGreaterThan(0)
    })

    test('возвращает пустую строку для пустых изменений', () => {
      const { stats } = createSystem()
      const result = stats.summarizeStatChanges({})
      expect(result).toBe('')
    })
  })
})
