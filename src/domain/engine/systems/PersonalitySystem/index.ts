import { PLAYER_ENTITY, PERSONALITY_COMPONENT, TIME_COMPONENT } from '../../components'
import type { GameWorld } from '../../world'
import { PERSONALITY_TRAITS } from '@/domain/balance/constants/personality-traits'
import { PersonalityAxis, type PersonalityComponent, type PersonalityTrait } from '@/domain/balance/types/personality'
import { StatsSystem } from '../StatsSystem'
import { telemetryInc } from '../../utils/telemetry'

const PERSONALITY_AXIS_MIN = -100
const PERSONALITY_AXIS_MAX = 100

/**
 * Система управления чертами характера и их постепенным смещением.
 *
 * `getCombinedModifiers()` — сумма `modifiers` по всем разблокированным чертам (ключи —
 * множители и бонусы из баланса, например `learningSpeedMultiplier`, `salaryMultiplier`).
 * Неразблокированные черты не учитываются. Пустой объект, если компонента личности нет.
 */
export class PersonalitySystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensurePersonalityComponent()
  }

  update(world: GameWorld, deltaHours: number): void {
    const personality = world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)

    if (!personality) return

    this._applyAxisDrift(personality, deltaHours)
    this._checkTraitUnlocks(personality)
  }

  modifyAxis(axis: PersonalityAxis, delta: number): void {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)

    if (!personality) return

    const before = personality.axes[axis].value
    personality.axes[axis].value = this._clampAxisValue(personality.axes[axis].value + delta)
    if (personality.axes[axis].value !== before) {
      telemetryInc(`personality_axis_change:${axis}`)
    }

    this._checkTraitUnlocks(personality)
  }

  getCombinedModifiers(): Record<string, number> {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)

    if (!personality) return {}

    const modifiers: Record<string, number> = {}

    personality.traits
      .filter(t => t.unlocked)
      .forEach(trait => {
        Object.entries(trait.modifiers).forEach(([key, value]) => {
          if (value === undefined) return
          modifiers[key] = (modifiers[key] || 0) + value
        })
      })

    return modifiers
  }

  getAxisValue(axis: PersonalityAxis): number {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)
    if (!personality) return 0
    return personality.axes[axis].value
  }

  getAllAxes(): Record<PersonalityAxis, number> {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)
    if (!personality) {
      return {
        [PersonalityAxis.OPENNESS]: 0,
        [PersonalityAxis.CONSCIENTIOUSNESS]: 0,
        [PersonalityAxis.EXTRAVERSION]: 0,
        [PersonalityAxis.AGREEABLENESS]: 0,
        [PersonalityAxis.NEUROTICISM]: 0,
      }
    }
    return {
      [PersonalityAxis.OPENNESS]: personality.axes.openness.value,
      [PersonalityAxis.CONSCIENTIOUSNESS]: personality.axes.conscientiousness.value,
      [PersonalityAxis.EXTRAVERSION]: personality.axes.extraversion.value,
      [PersonalityAxis.AGREEABLENESS]: personality.axes.agreeableness.value,
      [PersonalityAxis.NEUROTICISM]: personality.axes.neuroticism.value,
    }
  }

  getUnlockedTraits(): PersonalityTrait[] {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)
    if (!personality) return []
    return personality.traits.filter(t => t.unlocked)
  }

  hasTrait(traitId: string): boolean {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)
    if (!personality) return false
    const trait = personality.traits.find(t => t.id === traitId)
    return Boolean(trait?.unlocked)
  }

  private _ensurePersonalityComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)

    if (!existing) {
      const defaultPersonality: PersonalityComponent = {
        axes: {
          openness: { value: 0, drift: 0, lastUpdateAt: 0 },
          conscientiousness: { value: 0, drift: 0, lastUpdateAt: 0 },
          extraversion: { value: 0, drift: 0, lastUpdateAt: 0 },
          agreeableness: { value: 0, drift: 0, lastUpdateAt: 0 },
          neuroticism: { value: 0, drift: 0, lastUpdateAt: 0 },
        },
        traits: PERSONALITY_TRAITS.map(t => ({ ...t, unlocked: false })),
        driftSpeed: 0.05,
      }

      this.world.addTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT, defaultPersonality)
    }
  }

  private _applyAxisDrift(personality: PersonalityComponent, deltaHours: number): void {
    if (deltaHours <= 0) return

    const currentAge = this._getCurrentAge()
    const childhoodMultiplier = currentAge !== null && currentAge < 18 ? 2.0 : 1.0
    const driftMultiplier = deltaHours * personality.driftSpeed * childhoodMultiplier

    Object.values(personality.axes).forEach(axis => {
      axis.value += axis.drift * driftMultiplier
      axis.value = this._clampAxisValue(axis.value)
      axis.drift *= 0.999
    })

    telemetryInc('personality_drift_applied')
  }

  private _getCurrentAge(): number | null {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return null
    return (time.currentAge as number) ?? null
  }

  private _checkTraitUnlocks(personality: PersonalityComponent): void {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    const currentHour = (time?.totalHours as number) || 0
    const currentAge = (time?.currentAge as number) ?? 0

    personality.traits.forEach(trait => {
      if (trait.unlocked) return

      if (currentAge < trait.formAgeStart || currentAge > trait.formAgeEnd) return

      const axisValue = personality.axes[trait.axis].value
      const thresholdReached = trait.threshold > 0
        ? axisValue >= trait.threshold
        : axisValue <= trait.threshold

      if (thresholdReached) {
        trait.unlocked = true
        trait.unlockedAt = currentHour
        this._onTraitUnlocked(trait)
      }
    })
  }

  /**
   * Принудительно дать черту характера (через событие/выбор).
   * Используется для детских событий которые формируют личность.
   */
  acquireTrait(traitId: string): boolean {
    const personality = this.world.getTypedComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT)
    if (!personality) return false

    const trait = personality.traits.find(t => t.id === traitId)
    if (!trait || trait.unlocked) return false

    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    const currentHour = (time?.totalHours as number) || 0

    trait.unlocked = true
    trait.unlockedAt = currentHour

    this._onTraitUnlocked(trait)
    return true
  }

  private _onTraitUnlocked(trait: PersonalityTrait): void {
    telemetryInc(`personality_trait_unlocked:${trait.id}`)
    this.world.emitDomainEvent('personality:trait_unlocked', { trait })
    this._emitTraitActivity(trait)
  }

  private _emitTraitActivity(trait: PersonalityTrait): void {
    const bus = this.world?.eventBus
    if (!bus) return

    bus.dispatchEvent(new CustomEvent('activity:event', {
      detail: {
        category: 'personality',
        title: trait.name,
        description: trait.description || trait.acquireCondition,
        icon: null,
        metadata: {
          traitId: trait.id,
          axis: trait.axis,
        },
      },
    }))
  }

  private _clampAxisValue(value: number): number {
    const stats = this.world.getSystem(StatsSystem)
    if (stats) {
      return stats._clamp(value, PERSONALITY_AXIS_MIN, PERSONALITY_AXIS_MAX)
    }
    return Math.max(PERSONALITY_AXIS_MIN, Math.min(PERSONALITY_AXIS_MAX, value))
  }
}
