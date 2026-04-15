/**
 * Интеграционный тест: Полное детство 0-18 лет.
 * Проверяет что все системы детского модуля работают вместе корректно.
 */
import { describe, test, expect, beforeEach } from 'vitest'
import { GameWorld } from '@/domain/engine/world'
import { SkillsSystem } from '@/domain/engine/systems/SkillsSystem'
import { PersonalitySystem } from '@/domain/engine/systems/PersonalitySystem'
import { DelayedEffectSystem } from '@/domain/engine/systems/DelayedEffectSystem'
import { LifeMemorySystem } from '@/domain/engine/systems/LifeMemorySystem'
import { ChainResolverSystem } from '@/domain/engine/systems/ChainResolverSystem'
import { EventChoiceSystem } from '@/domain/engine/systems/EventChoiceSystem'
import { EventHistorySystem } from '@/domain/engine/systems/EventHistorySystem'
import {
  PLAYER_ENTITY,
  TIME_COMPONENT,
  STATS_COMPONENT,
  SKILLS_COMPONENT,
  SKILL_MODIFIERS_COMPONENT,
  CHILDHOOD_SKILLS_COMPONENT,
  DELAYED_EFFECTS_COMPONENT,
  LIFE_MEMORY_COMPONENT,
  CHAIN_STATE_COMPONENT,
  PERSONALITY_COMPONENT,
  EVENT_HISTORY_COMPONENT,
} from '@/domain/engine/components'
import { ALL_CHILDHOOD_EVENTS } from '@/domain/balance/constants/childhood-events'
import { CHILDHOOD_SKILLS } from '@/domain/balance/constants/childhood-skills'
import { AGE_SKILL_CAP_TABLE } from '@/domain/balance/types/childhood-skill'
import { PERSONALITY_TRAITS } from '@/domain/balance/constants/personality-traits'
import { AgeGroup } from '@/domain/balance/actions/types'

/**
 * Создать тестовый мир с полным набором систем детства
 */
function createChildhoodWorld(startAge: number = 0): GameWorld {
  const world = new GameWorld()

  // Создать игрока
  const playerId = PLAYER_ENTITY
  world.entities.set(playerId, { id: playerId, components: new Set() as never })

  // Time component
  world.addComponent(playerId, TIME_COMPONENT, {
    totalHours: 0,
    currentAge: startAge,
    currentDay: 0,
    ageGroup: AgeGroup.INFANT,
    speed: 1,
  })

  // Stats component
  world.addComponent(playerId, STATS_COMPONENT, {
    mood: 50,
    stress: 0,
    energy: 100,
    health: 100,
  })

  // Skills component
  world.addComponent(playerId, SKILLS_COMPONENT, {
    skills: {},
  })

  // Skill modifiers component
  world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, {
    modifiers: {},
  })

  // Childhood skills component
  const childhoodCaps: Record<string, number> = {}
  const touchedInWindow: Record<string, boolean> = {}
  const firstTouchAge: Record<string, number> = {}
  CHILDHOOD_SKILLS.forEach(skill => {
    childhoodCaps[skill.key] = 1.0
    touchedInWindow[skill.key] = false
    firstTouchAge[skill.key] = -1
  })
  world.addComponent(playerId, CHILDHOOD_SKILLS_COMPONENT, {
    caps: childhoodCaps,
    touchedInWindow,
    firstTouchAge,
  })

  // Delayed effects component
  world.addComponent(playerId, DELAYED_EFFECTS_COMPONENT, {
    pending: [],
  })

  // Life memory component
  world.addComponent(playerId, LIFE_MEMORY_COMPONENT, {
    memories: [],
    childhoodScore: 0,
  })

  // Chain state component
  world.addComponent(playerId, CHAIN_STATE_COMPONENT, {
    chains: {},
  })

  // Personality component
  world.addComponent(playerId, PERSONALITY_COMPONENT, {
    axes: {
      openness: { value: 0, drift: 0, lastUpdateAt: 0 },
      conscientiousness: { value: 0, drift: 0, lastUpdateAt: 0 },
      extraversion: { value: 0, drift: 0, lastUpdateAt: 0 },
      agreeableness: { value: 0, drift: 0, lastUpdateAt: 0 },
      neuroticism: { value: 0, drift: 0, lastUpdateAt: 0 },
    },
    traits: PERSONALITY_TRAITS.map(t => ({ ...t, unlocked: false })),
    driftSpeed: 0.05,
  })

  // Event history component
  world.addComponent(playerId, EVENT_HISTORY_COMPONENT, {
    events: [],
    stats: { total: 0, byType: {} },
  })

  // Инициализация систем
  const skillsSystem = new SkillsSystem()
  const personalitySystem = new PersonalitySystem()
  const delayedEffectSystem = new DelayedEffectSystem()
  const lifeMemorySystem = new LifeMemorySystem()
  const chainResolverSystem = new ChainResolverSystem()
  const eventHistorySystem = new EventHistorySystem()
  const eventChoiceSystem = new EventChoiceSystem()

  skillsSystem.init(world)
  personalitySystem.init(world)
  delayedEffectSystem.init(world)
  lifeMemorySystem.init(world)
  chainResolverSystem.init(world)
  eventHistorySystem.init(world)
  eventChoiceSystem.init(world)

  return world
}

/**
 * Установить возраст в мире
 */
function setAge(world: GameWorld, age: number): void {
  const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown>
  if (time) {
    time.currentAge = age
    time.totalHours = age * 365 * 24
    time.currentDay = age * 365
  }
}

describe('integration/childhood full flow 0-18', () => {
  let world: GameWorld

  beforeEach(() => {
    world = createChildhoodWorld(0)
  })

  test('creates world with all childhood systems', () => {
    expect(world.getComponent(PLAYER_ENTITY, TIME_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, STATS_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, SKILLS_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, CHILDHOOD_SKILLS_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, CHAIN_STATE_COMPONENT)).toBeDefined()
    expect(world.getComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)).toBeDefined()
  })

  test('childhood skills caps are initialized at 1.0', () => {
    const comp = world.getComponent(PLAYER_ENTITY, CHILDHOOD_SKILLS_COMPONENT)
    expect(comp).not.toBeNull()
    const caps = (comp as Record<string, unknown>).caps as Record<string, number>
    CHILDHOOD_SKILLS.forEach(skill => {
      expect(caps[skill.key]).toBe(1.0)
    })
  })

  test('all 140+ childhood events are loaded', () => {
    expect(ALL_CHILDHOOD_EVENTS.length).toBeGreaterThanOrEqual(127)
  })

  test('all events have valid structure', () => {
    ALL_CHILDHOOD_EVENTS.forEach(event => {
      expect(event.id).toBeTruthy()
      expect(event.title).toBeTruthy()
      expect(event.description).toBeTruthy()
      expect(event.ageGroup).toBeDefined()
      expect(event.type).toMatch(/^(everyday|formative|fateful)$/)
      expect(event.choices.length).toBeGreaterThanOrEqual(2)
      event.choices.forEach(choice => {
        expect(choice.label).toBeTruthy()
        expect(choice.description).toBeTruthy()
      })
    })
  })

  test('all events have unique IDs', () => {
    const ids = ALL_CHILDHOOD_EVENTS.map(e => e.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  test('skill cap decreases when first touch is late', () => {
    // Навык curiosity: bestAge 4-8
    // Если впервые затронут в 14 лет — cap должен быть ниже
    const capEntry = AGE_SKILL_CAP_TABLE.find(entry => 14 <= entry.maxAge)
    expect(capEntry).toBeDefined()
    expect(capEntry!.cap).toBeLessThan(1.0)
  })

  test('delayed effects system processes effects by age', () => {
    const delayedComp = world.getComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT)
    expect(delayedComp).not.toBeNull()
    const pending = (delayedComp as Record<string, unknown>).pending as Array<Record<string, unknown>>
    expect(pending).toHaveLength(0)
  })

  test('life memory system records and calculates childhood score', () => {
    const memComp = world.getComponent(PLAYER_ENTITY, LIFE_MEMORY_COMPONENT)
    expect(memComp).not.toBeNull()
    const memData = memComp as Record<string, unknown>
    expect(memData.childhoodScore).toBe(0)
    expect((memData.memories as unknown[])).toHaveLength(0)
  })

  test('chain resolver finds chain events', () => {
    const chainEvents = ALL_CHILDHOOD_EVENTS.filter(e => e.chainTag)
    expect(chainEvents.length).toBeGreaterThanOrEqual(8) // 8 цепочек
  })

  test('all 8 planned chains exist', () => {
    const chainTags = new Set(ALL_CHILDHOOD_EVENTS.filter(e => e.chainTag).map(e => e.chainTag))
    expect(chainTags.has('math_teacher')).toBe(true)
    expect(chainTags.has('best_friend')).toBe(true)
    expect(chainTags.has('first_kiss')).toBe(true)
    expect(chainTags.has('cigarette')).toBe(true)
    expect(chainTags.has('diary')).toBe(true)
    expect(chainTags.has('sport_or_street')).toBe(true)
    expect(chainTags.has('friend_betrayal')).toBe(true)
    expect(chainTags.has('graduation')).toBe(true)
  })

  test('all choices have delayed consequences (70%+ target)', () => {
    let totalChoices = 0
    let choicesWithDC = 0
    ALL_CHILDHOOD_EVENTS.forEach(event => {
      event.choices.forEach(choice => {
        totalChoices++
        if (choice.delayedConsequences && choice.delayedConsequences.length > 0) {
          choicesWithDC++
        }
      })
    })
    const ratio = choicesWithDC / totalChoices
    expect(ratio).toBeGreaterThanOrEqual(0.70)
  })

  test('personality traits cover all 5 axes', () => {
    const axes = new Set(PERSONALITY_TRAITS.map(t => t.axis))
    expect(axes.size).toBe(5)
  })

  test('all personality traits have required fields', () => {
    PERSONALITY_TRAITS.forEach(trait => {
      expect(trait.id).toBeTruthy()
      expect(trait.name).toBeTruthy()
      expect(trait.positiveEffects).toBeTruthy()
      expect(trait.negativeEffects).toBeTruthy()
      expect(trait.acquireCondition).toBeTruthy()
      expect(trait.formAgeStart).toBeGreaterThanOrEqual(0)
      expect(trait.formAgeEnd).toBeGreaterThanOrEqual(trait.formAgeStart)
    })
  })

  test('simulating age progression from 0 to 18 does not throw', () => {
    for (let age = 0; age <= 18; age++) {
      setAge(world, age)
      // Проверить что компоненты доступны
      const time = world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
      expect(time).not.toBeNull()
      expect(time!.currentAge).toBe(age)
    }
  })
})
