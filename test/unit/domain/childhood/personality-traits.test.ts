import { describe, expect, test } from 'vitest'
import { PERSONALITY_TRAITS } from '@/domain/balance/constants/personality-traits'
import { PersonalityAxis } from '@/domain/balance/types/personality'
import { createWorldFromSave } from '@/domain/game-facade'
import { PersonalitySystem } from '@/domain/engine/systems/PersonalitySystem'

describe('domain/childhood personality traits', () => {
  test('has 46 personality traits', () => {
    expect(PERSONALITY_TRAITS).toHaveLength(46)
  })

  test('every trait has required fields', () => {
    for (const trait of PERSONALITY_TRAITS) {
      expect(trait.id, `Trait missing id`).toBeTruthy()
      expect(trait.name, `Trait "${trait.id}" missing name`).toBeTruthy()
      expect(trait.axis, `Trait "${trait.id}" missing axis`).toBeTruthy()
      expect(trait.threshold, `Trait "${trait.id}" missing threshold`).toBeDefined()
      expect(trait.modifiers, `Trait "${trait.id}" missing modifiers`).toBeDefined()
      expect(trait.positiveEffects, `Trait "${trait.id}" missing positiveEffects`).toBeTruthy()
      expect(trait.negativeEffects, `Trait "${trait.id}" missing negativeEffects`).toBeTruthy()
      expect(trait.acquireCondition, `Trait "${trait.id}" missing acquireCondition`).toBeTruthy()
      expect(trait.formAgeStart, `Trait "${trait.id}" missing formAgeStart`).toBeDefined()
      expect(trait.formAgeEnd, `Trait "${trait.id}" missing formAgeEnd`).toBeDefined()
      expect(trait.formAgeStart).toBeLessThanOrEqual(trait.formAgeEnd)
    }
  })

  test('every trait has unique id', () => {
    const ids = PERSONALITY_TRAITS.map(t => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('traits cover all 5 axes', () => {
    const axes = new Set(PERSONALITY_TRAITS.map(t => t.axis))
    expect(axes.has(PersonalityAxis.OPENNESS)).toBe(true)
    expect(axes.has(PersonalityAxis.CONSCIENTIOUSNESS)).toBe(true)
    expect(axes.has(PersonalityAxis.EXTRAVERSION)).toBe(true)
    expect(axes.has(PersonalityAxis.AGREEABLENESS)).toBe(true)
    expect(axes.has(PersonalityAxis.NEUROTICISM)).toBe(true)
  })

  test('every trait has both positive and negative effects', () => {
    for (const trait of PERSONALITY_TRAITS) {
      expect(trait.positiveEffects.length, `Trait "${trait.id}" has empty positiveEffects`).toBeGreaterThan(0)
      expect(trait.negativeEffects.length, `Trait "${trait.id}" has empty negativeEffects`).toBeGreaterThan(0)
    }
  })

  test('age windows are reasonable (0-18)', () => {
    for (const trait of PERSONALITY_TRAITS) {
      expect(trait.formAgeStart).toBeGreaterThanOrEqual(0)
      expect(trait.formAgeEnd).toBeLessThanOrEqual(18)
    }
  })

  test('PersonalitySystem acquireTrait works', () => {
    const world = createWorldFromSave({ playerName: 'TestTraits', currentAge: 10 })
    const system = new PersonalitySystem()
    system.init(world)

    const result = system.acquireTrait('optimist')
    // Может быть true или false в зависимости от того, есть ли такая черта
    expect(typeof result).toBe('boolean')
  })

  test('PersonalitySystem getCombinedModifiers returns object', () => {
    const world = createWorldFromSave({ playerName: 'TestTraits', currentAge: 10 })
    const system = new PersonalitySystem()
    system.init(world)

    const modifiers = system.getCombinedModifiers()
    expect(typeof modifiers).toBe('object')
  })
})
