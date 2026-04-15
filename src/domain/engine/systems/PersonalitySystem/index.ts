import { PLAYER_ENTITY, PERSONALITY_COMPONENT } from '../../components'
import type { GameWorld } from '../../world'
import { PERSONALITY_TRAITS } from '@/domain/balance/constants/personality-traits'
import type { PersonalityComponent, PersonalityAxis } from '@/domain/balance/types/personality'

/**
 * Система управления чертами характера и их постепенным смещением
 */
export class PersonalitySystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensurePersonalityComponent()
  }

  update(world: GameWorld, deltaHours: number): void {
    const personality = world.getTypedComponent<PersonalityComponent>(
      PLAYER_ENTITY,
      PERSONALITY_COMPONENT
    )

    if (!personality) return

    this._applyAxisDrift(personality, deltaHours)
    this._checkTraitUnlocks(personality)
  }

  modifyAxis(axis: PersonalityAxis, delta: number): void {
    const personality = this.world.getTypedComponent<PersonalityComponent>(
      PLAYER_ENTITY,
      PERSONALITY_COMPONENT
    )

    if (!personality) return

    personality.axes[axis].value = this._clamp(
      personality.axes[axis].value + delta,
      -100,
      100
    )

    this._checkTraitUnlocks(personality)
  }

  getCombinedModifiers(): Record<string, number> {
    const personality = this.world.getTypedComponent<PersonalityComponent>(
      PLAYER_ENTITY,
      PERSONALITY_COMPONENT
    )

    if (!personality) return {}

    const modifiers: Record<string, number> = {}

    personality.traits
      .filter(t => t.unlocked)
      .forEach(trait => {
        Object.entries(trait.modifiers).forEach(([key, value]) => {
          modifiers[key] = (modifiers[key] || 0) + value
        })
      })

    return modifiers
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
    // В детстве (до 18 лет) дрейф осей усилен — личность формируется быстрее
    const currentAge = this._getCurrentAge()
    const childhoodMultiplier = currentAge !== null && currentAge < 18 ? 2.0 : 1.0
    const driftMultiplier = deltaHours * personality.driftSpeed * childhoodMultiplier

    Object.values(personality.axes).forEach(axis => {
      axis.value += axis.drift * driftMultiplier
      axis.value = this._clamp(axis.value, -100, 100)

      // Постепенное уменьшение дрейфа к нулю
      axis.drift *= 0.999
    })
  }

  private _getCurrentAge(): number | null {
    const time = this.world.getComponent('player', 'time') as Record<string, unknown> | null
    if (!time) return null
    return (time.currentAge as number) ?? null
  }

  private _checkTraitUnlocks(personality: PersonalityComponent): void {
    const time = this.world.getComponent(PLAYER_ENTITY, 'time') as Record<string, unknown> | null
    const currentHour = (time?.totalHours as number) || 0
    const currentAge = (time?.currentAge as number) ?? 0

    personality.traits.forEach(trait => {
      if (trait.unlocked) return

      // Проверка возрастного окна формирования
      const formAgeStart = (trait as unknown as { formAgeStart?: number }).formAgeStart ?? 0
      const formAgeEnd = (trait as unknown as { formAgeEnd?: number }).formAgeEnd ?? 100
      if (currentAge < formAgeStart || currentAge > formAgeEnd) return

      const axisValue = personality.axes[trait.axis].value
      const thresholdReached = trait.threshold > 0
        ? axisValue >= trait.threshold
        : axisValue <= trait.threshold

      if (thresholdReached) {
        trait.unlocked = true
        trait.unlockedAt = currentHour

        this.world.emitDomainEvent('personality:trait_unlocked', { trait })
      }
    })
  }

  /**
   * Принудительно дать черту характера (через событие/выбор).
   * Используется для детских событий которые формируют личность.
   */
  acquireTrait(traitId: string): boolean {
    const personality = this.world.getComponent(PLAYER_ENTITY, PERSONALITY_COMPONENT) as Record<string, unknown> | null
    if (!personality) return false

    const traits = personality.traits as Array<Record<string, unknown>>
    const trait = traits.find(t => t.id === traitId)
    if (!trait || trait.unlocked) return false

    const time = this.world.getComponent(PLAYER_ENTITY, 'time') as Record<string, unknown> | null
    const currentHour = (time?.totalHours as number) || 0

    trait.unlocked = true
    trait.unlockedAt = currentHour

    this.world.emitDomainEvent('personality:trait_unlocked', { trait })
    return true
  }

  private _clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }
}
