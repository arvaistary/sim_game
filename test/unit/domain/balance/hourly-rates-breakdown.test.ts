import { describe, expect, it } from 'vitest'
import {
  calculateStatChanges,
  calculateStatChangesWithBreakdown,
} from '@domain/balance/utils/hourly-rates'

describe('calculateStatChangesWithBreakdown', () => {
  it('matches calculateStatChanges for every stat (sleep fixture: база только из statChanges)', () => {
    const flat = { energy: 32, mood: 6, stress: -9, health: -3, hunger: -3.6, physical: 0.6 }
    const plain = calculateStatChanges({ actionType: 'sleep', hours: 6, flatStatChanges: flat })
    const { statChanges, breakdown } = calculateStatChangesWithBreakdown({ actionType: 'sleep', hours: 6, flatStatChanges: flat })

    expect(statChanges).toEqual(plain)

    for (const row of breakdown) {
      expect(row.final).toBe(plain[row.stat] ?? 0)
    }
  })

  it('matches with sleep debt (stress gets sleep penalty on sleep action)', () => {
    const flat = { energy: 32, mood: 6, stress: -9, health: -3 }
    const sleepDebt = 4
    const plain = calculateStatChanges({ actionType: 'sleep', hours: 6, flatStatChanges: flat, sleepDebt })
    const { statChanges, breakdown } = calculateStatChangesWithBreakdown({ actionType: 'sleep', hours: 6, flatStatChanges: flat, sleepDebt })

    expect(statChanges).toEqual(plain)
    for (const row of breakdown) {
      expect(row.final).toBe(plain[row.stat] ?? 0)
    }

    const stressRow = breakdown.find(b => b.stat === 'stress')
    expect(stressRow?.sleepDebtDelta).toBe(4 * 0.8)
    const energyRow = breakdown.find(b => b.stat === 'energy')
    expect(energyRow?.sleepDebtDelta).toBe(0)
  })

  it('matches with per-stat modifier', () => {
    const modifiers = { mood: 0.1 }
    const flat = { mood: 10 }
    const plain = calculateStatChanges({ actionType: 'neutral', hours: 2, flatStatChanges: flat, modifiers })
    const { statChanges, breakdown } = calculateStatChangesWithBreakdown({ actionType: 'neutral', hours: 2, flatStatChanges: flat, modifiers })

    expect(statChanges).toEqual(plain)
    for (const row of breakdown) {
      expect(row.final).toBe(plain[row.stat] ?? 0)
    }
  })

  it('matches aging on negative deltas', () => {
    const flat = { hunger: -5 }
    const age = 50
    const plain = calculateStatChanges({ actionType: 'neutral', hours: 1, flatStatChanges: flat, currentAge: age })
    const { statChanges, breakdown } = calculateStatChangesWithBreakdown({ actionType: 'neutral', hours: 1, flatStatChanges: flat, currentAge: age })

    expect(statChanges).toEqual(plain)
    const hunger = breakdown.find(b => b.stat === 'hunger')
    expect(hunger?.agingApplied).toBe(true)
    expect(hunger?.final).toBe(plain.hunger ?? 0)
  })

  it('длительность (hours) не меняет дельты — только база из statChanges', () => {
    const flat = { energy: 10 }
    const a = calculateStatChanges({ actionType: 'neutral', hours: 1, flatStatChanges: flat })
    const b = calculateStatChanges({ actionType: 'neutral', hours: 8, flatStatChanges: flat })
    expect(a).toEqual(b)
  })
})
