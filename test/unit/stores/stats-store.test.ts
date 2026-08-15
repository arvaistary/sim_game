import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatsStore } from '@/stores/stats-store'

describe('stats-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('должен инициализироваться с значениями по умолчанию', () => {
    const stats = useStatsStore()
    expect(stats.energy).toBe(70)
    expect(stats.health).toBe(80)
    expect(stats.hunger).toBe(70)
    expect(stats.stress).toBe(30)
    expect(stats.mood).toBe(60)
  })

  it('должен применять statChanges корректно', () => {
    const stats = useStatsStore()
    stats.applyStatChanges({ energy: -20, health: -10 })
    expect(stats.energy).toBe(50)
    expect(stats.health).toBe(70)
  })

  it('должен применять statChangesRaw корректно', () => {
    const stats = useStatsStore()
    stats.applyStatChangesRaw({ energy: -30, stress: +20 })
    expect(stats.energy).toBe(40)
    expect(stats.stress).toBe(50)
  })

  it('должен ограничивать значения диапазоном каждой шкалы', () => {
    const stats = useStatsStore()
    stats.applyStatChanges({ energy: -150 })
    expect(stats.energy).toBe(0)

    stats.applyStatChanges({ health: +200 })
    expect(stats.health).toBe(100)
  })

  it('должен сохранять дефицит нефатальных шкал до -150', () => {
    const stats = useStatsStore()

    stats.setStats({ mood: -150, physical: -150, hunger: 250, stress: 250 })

    expect(stats.mood).toBe(-150)
    expect(stats.physical).toBe(-150)
    expect(stats.hunger).toBe(250)
    expect(stats.stress).toBe(250)
  })

  it('должен правильно вычислять isTired', () => {
    const stats = useStatsStore()
    stats.energy = 15
    expect(stats.isTired).toBe(true)

    stats.energy = 25
    expect(stats.isTired).toBe(false)
  })

  it('должен правильно вычислять isStarving', () => {
    const stats = useStatsStore()
    stats.hunger = 85
    expect(stats.isStarving).toBe(true)

    stats.hunger = 75
    expect(stats.isStarving).toBe(false)
  })

  it('должен правильно вычислять isStressed', () => {
    const stats = useStatsStore()
    stats.stress = 90
    expect(stats.isStressed).toBe(true)

    stats.stress = 75
    expect(stats.isStressed).toBe(false)
  })

  it('должен правильно вычислять isHappy', () => {
    const stats = useStatsStore()
    stats.mood = 80
    expect(stats.isHappy).toBe(true)

    stats.mood = 65
    expect(stats.isHappy).toBe(false)
  })

  it('restoreAll должен восстанавливать статы', () => {
    const stats = useStatsStore()
    stats.energy = 20
    stats.health = 30
    stats.mood = 40
    stats.restoreAll()
    expect(stats.energy).toBe(100)
    expect(stats.health).toBe(100)
    expect(stats.mood).toBe(100)
  })

  it('reset должен сбрасывать в начальное состояние', () => {
    const stats = useStatsStore()
    stats.energy = 50
    stats.stress = 50
    stats.reset()
    expect(stats.energy).toBe(70)
    expect(stats.stress).toBe(30)
  })
})
