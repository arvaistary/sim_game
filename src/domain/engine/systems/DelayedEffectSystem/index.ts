import {
  PLAYER_ENTITY,
  DELAYED_EFFECTS_COMPONENT,
  TIME_COMPONENT,
} from '../../components'
import type { GameWorld } from '../../world'
import type { DelayedEffectEntry, DelayedEffectsComponent } from './index.types'
import { SkillsSystem } from '../SkillsSystem'
import { PersonalitySystem } from '../PersonalitySystem'
import { StatsSystem } from '../StatsSystem'

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
  private statsSystem!: StatsSystem
  private nextEffectId = 0

  init(world: GameWorld): void {
    this.world = world
    this.skillsSystem = this._resolveSkillsSystem()
    this.personalitySystem = this._resolvePersonalitySystem()
    this.statsSystem = this._resolveStatsSystem()
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
      id: `de_${++this.nextEffectId}_${Date.now()}`,
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

  /**
   * Отменить запланированный эффект по ID.
   * Returns true если эффект был найден и удалён.
   */
  cancelEffect(effectId: string): boolean {
    const component = this._getComponent()
    if (!component) return false

    const index = component.pending.findIndex(e => e.id === effectId && !e.triggered)
    if (index === -1) return false

    component.pending.splice(index, 1)
    return true
  }

  // ─── Приватные методы ─────────────────────────────────────────────

  /**
   * Применить отложенное последствие к состоянию игрока.
   */
  private _triggerEffect(entry: DelayedEffectEntry): void {
    entry.triggered = true

    // 1. Применить изменения характеристик
    if (entry.statChanges && Object.keys(entry.statChanges).length > 0) {
      this.statsSystem.applyStatChanges(entry.statChanges)
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

  private _resolveSkillsSystem(): SkillsSystem {
    const existing = this.world.getSystem(SkillsSystem)
    if (existing) return existing
    const created = new SkillsSystem()
    this.world.addSystem(created)
    created.init(this.world)
    return created
  }

  private _resolvePersonalitySystem(): PersonalitySystem {
    const existing = this.world.getSystem(PersonalitySystem)
    if (existing) return existing
    const created = new PersonalitySystem()
    this.world.addSystem(created)
    created.init(this.world)
    return created
  }

  private _resolveStatsSystem(): StatsSystem {
    const existing = this.world.getSystem(StatsSystem)
    if (existing) return existing
    const created = new StatsSystem()
    this.world.addSystem(created)
    return created
  }
}

