import {
  PLAYER_ENTITY,
  DELAYED_EFFECTS_COMPONENT,
  TIME_COMPONENT,
  STATS_COMPONENT,
} from '../../components'
import type { GameWorld } from '../../world'
import { SkillsSystem } from '../SkillsSystem'
import { PersonalitySystem } from '../PersonalitySystem'
import type { DelayedEffectEntry, DelayedEffectsComponent } from './index.types'

let _nextEffectId = 0

/**
 * Система отложенных последствий
 *
 * Отслеживает эффекты, запланированные на определённый возраст персонажа.
 * Когда текущий возраст достигает triggerAge — эффект применяется:
 *   - statChanges → через STATS_COMPONENT
 *   - skillChanges → через SkillsSystem
 *   - grantTrait → через PersonalitySystem.acquireTrait()
 *   - memoryId → через доменное событие (LifeMemorySystem на этапе 5)
 *
 * 70% выборов в детских событиях имеют хотя бы одно отложенное последствие.
 */
export class DelayedEffectSystem {
  private world!: GameWorld
  private skillsSystem!: SkillsSystem
  private personalitySystem!: PersonalitySystem

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = new SkillsSystem()
    this.skillsSystem.init(world)
    this.personalitySystem = new PersonalitySystem()
    this.personalitySystem.init(world)
    this._ensureComponent()
  }

  update(world: GameWorld, _deltaHours: number): void {
    const currentAge = this._getCurrentAge()
    if (currentAge === null) return

    const component = this._getComponent()
    if (!component) return

    for (const entry of component.pending) {
      if (entry.triggered) continue
      if (entry.triggerAge > currentAge) continue

      this._triggerEffect(entry)
    }
  }

  /**
   * Запланировать отложенное последствие.
   * Вызывается из EventChoiceSystem после обработки немедленных эффектов выбора.
   */
  scheduleEffect(entry: Omit<DelayedEffectEntry, 'id' | 'triggered'>): DelayedEffectEntry {
    const component = this._getComponent()
    if (!component) {
      throw new Error('[DelayedEffectSystem] Компонент delayed_effects не инициализирован')
    }

    const fullEntry: DelayedEffectEntry = {
      ...entry,
      id: `de_${++_nextEffectId}_${Date.now()}`,
      triggered: false,
    }

    component.pending.push(fullEntry)
    return fullEntry
  }

  /**
   * Получить все ожидающие (не сработавшие) эффекты.
   */
  getPendingEffects(): DelayedEffectEntry[] {
    const component = this._getComponent()
    if (!component) return []
    return component.pending.filter(e => !e.triggered)
  }

  /**
   * Получить все уже сработавшие эффекты.
   */
  getTriggeredEffects(): DelayedEffectEntry[] {
    const component = this._getComponent()
    if (!component) return []
    return component.pending.filter(e => e.triggered)
  }

  /**
   * Получить все эффекты (и ожидающие, и сработавшие).
   */
  getAllEffects(): DelayedEffectEntry[] {
    const component = this._getComponent()
    if (!component) return []
    return [...component.pending]
  }

  // ─── Приватные методы ─────────────────────────────────────────────

  /**
   * Применить отложенное последствие к состоянию игрока.
   */
  private _triggerEffect(entry: DelayedEffectEntry): void {
    entry.triggered = true

    // 1. Применить изменения характеристик
    if (entry.statChanges && Object.keys(entry.statChanges).length > 0) {
      const stats = this.world.getComponent(PLAYER_ENTITY, STATS_COMPONENT) as Record<string, number> | null
      if (stats) {
        for (const [key, value] of Object.entries(entry.statChanges)) {
          if (typeof value === 'number') {
            stats[key] = this._clamp((stats[key] ?? 0) + value)
          }
        }
      }
    }

    // 2. Применить изменения навыков
    if (entry.skillChanges && Object.keys(entry.skillChanges).length > 0) {
      this.skillsSystem.applySkillChanges(entry.skillChanges, `delayed:${entry.sourceEventId}`)
    }

    // 3. Дать черту характера
    if (entry.grantTrait) {
      this.personalitySystem.acquireTrait(entry.grantTrait)
    }

    // 4. Отправить доменное событие для UI и LifeMemorySystem
    this.world.emitDomainEvent('delayed_effect:triggered', {
      id: entry.id,
      sourceEventId: entry.sourceEventId,
      description: entry.description,
      statChanges: entry.statChanges ?? null,
      skillChanges: entry.skillChanges ?? null,
      grantTrait: entry.grantTrait ?? null,
      memoryId: entry.memoryId ?? null,
    })
  }

  /**
   * Получить текущий возраст персонажа из TIME_COMPONENT.
   */
  private _getCurrentAge(): number | null {
    const time = this.world.getComponent(PLAYER_ENTITY, TIME_COMPONENT) as Record<string, unknown> | null
    if (!time) return null
    const age = time.currentAge as number | undefined
    return age !== undefined ? age : null
  }

  /**
   * Получить или создать компонент delayed_effects.
   */
  private _ensureComponent(): void {
    const existing = this.world.getComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT)
    if (!existing) {
      this.world.addComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT, {
        pending: [],
      })
    }
  }

  /**
   * Получить компонент delayed_effects.
   */
  private _getComponent(): DelayedEffectsComponent | null {
    return this.world.getComponent(PLAYER_ENTITY, DELAYED_EFFECTS_COMPONENT) as DelayedEffectsComponent | null
  }

  private _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }
}

