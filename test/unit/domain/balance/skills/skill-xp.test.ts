import { describe, expect, it } from 'vitest'

import {
  calculateSkillXpGain,
  distributeSkillXp,
  getAgeLearningMultiplier,
} from '@/domain/balance/skills/skill-xp'

describe('age learning multiplier', () => {
  it('favours childhood and penalises old age', () => {
    expect(getAgeLearningMultiplier(6)).toBe(2.5)
    expect(getAgeLearningMultiplier(30)).toBe(1.1)
    expect(getAgeLearningMultiplier(75)).toBe(0.3)
  })

  it('never returns a non-positive multiplier', () => {
    for (const age of [0, 18, 40, 60, 90, 120]) {
      expect(getAgeLearningMultiplier(age)).toBeGreaterThan(0)
    }
  })
})

describe('skill experience gain', () => {
  it('multiplies hours by method and age', () => {
    expect(calculateSkillXpGain({ hours: 2, method: 'mentor', age: 30 })).toBeCloseTo(4.4, 5)
  })

  it('treats a missing method as deliberate practice', () => {
    expect(calculateSkillXpGain({ hours: 2, method: undefined, age: 30 })).toBeCloseTo(3.3, 5)
  })

  it('returns zero for actions without hours', () => {
    expect(calculateSkillXpGain({ hours: 0, method: 'practice', age: 30 })).toBe(0)
    expect(calculateSkillXpGain({ hours: Number.NaN, method: 'practice', age: 30 })).toBe(0)
  })
})

describe('skill experience distribution', () => {
  it('splits experience proportionally to authored weights', () => {
    const distributed: Record<string, number> = distributeSkillXp({
      totalXp: 100,
      weights: { artisticMastery: 3.5, basicCreativity: 3 },
    })

    expect(distributed.artisticMastery).toBeCloseTo(53.85, 2)
    expect(distributed.basicCreativity).toBeCloseTo(46.15, 2)
  })

  it('gives everything to a single skill', () => {
    const distributed: Record<string, number> = distributeSkillXp({ totalXp: 42, weights: { cooking: 2.5 } })

    expect(distributed.cooking).toBeCloseTo(42, 5)
  })

  it('ignores non-positive weights', () => {
    const distributed: Record<string, number> = distributeSkillXp({
      totalXp: 100,
      weights: { cooking: 2, laziness: 0 },
    })

    expect(distributed.cooking).toBeCloseTo(100, 5)
    expect(distributed.laziness).toBeUndefined()
  })

  it('returns nothing when there is no experience to spread', () => {
    expect(distributeSkillXp({ totalXp: 0, weights: { cooking: 2 } })).toEqual({})
    expect(distributeSkillXp({ totalXp: 100, weights: {} })).toEqual({})
  })
})
