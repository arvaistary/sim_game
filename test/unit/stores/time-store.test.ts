import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimeStore } from '@/stores/time-store'

describe('time-store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('должен инициализироваться с значениями по умолчанию', () => {
    const time = useTimeStore()
    expect(time.totalHours).toBe(0)
    expect(time.sleepDebt).toBe(0)
    expect(time.currentAge).toBe(18)
  })

  it('должен правильно вычислять gameDays', () => {
    const time = useTimeStore()
    time.setTotalHours(24)
    expect(time.gameDays).toBe(1)
  })

  it('должен правильно вычислять gameWeeks', () => {
    const time = useTimeStore()
    time.setTotalHours(168) // 7 дней
    expect(time.gameWeeks).toBe(1)
  })

  it('должен правильно вычислять текущий возраст', () => {
    const time = useTimeStore()
    time.setTotalHours(8760) // 365 дней = 1 год
    expect(time.currentAge).toBe(19)
  })

  it('должен увеличивать sleepDebt при обычной деятельности', () => {
    const time = useTimeStore()
    time.advanceHours(8, { actionType: 'work' })
    expect(time.sleepDebt).toBe(4) // 8 * 0.5
  })

  it('должен правильно обрабатывать тип sleep', () => {
    const time = useTimeStore()
    time.sleepDebt = 10
    time.advanceHours(8, { actionType: 'sleep' })
    // При sleep debt остается тем же или уменьшается, но не увеличивается
    expect(time.sleepDebt).toBeLessThanOrEqual(10)
  })

  it('должен корректно уменьшать sleepDebt при сне', () => {
    const time = useTimeStore()
    time.sleepDebt = 20
    time.advanceHoursWithSleep(8, 8)
    expect(time.sleepDebt).toBe(4) // 20 - 8 * 2
  })

  it('должен правильно вычислять оставшееся время в неделе', () => {
    const time = useTimeStore()
    time.setTotalHours(100)
    expect(time.weekHoursRemaining).toBe(68) // 168 - 100
  })

  it('должен вычислять dayHour', () => {
    const time = useTimeStore()
    time.setTotalHours(26) // 1 день + 2 часа
    expect(time.dayHour).toBe(2)
  })

  it('reset должен сбрасывать состояние', () => {
    const time = useTimeStore()
    time.setTotalHours(100)
    time.sleepDebt = 50
    time.reset()
    expect(time.totalHours).toBe(0)
    expect(time.sleepDebt).toBe(0)
  })
})