import { telemetryInc } from '../../utils/telemetry'
import { SKILLS_COMPONENT, SKILL_MODIFIERS_COMPONENT, PLAYER_ENTITY } from '../../components/index'
import { recalculateSkillModifiers, createBaseSkillModifiers } from '../../../balance/constants/skill-modifiers'
import type { GameWorld } from '../../world'
import type { SkillModifiers } from '@/domain/balance/types'
import type { SkillChangeResult } from './index.types'

export class SkillsSystem {
  private world!: GameWorld

  init(world: GameWorld): void {
    this.world = world
    this._ensureModifiersComponent()
    this.recalculateModifiers()
  }

  _ensureModifiersComponent(): void {
    const playerId = PLAYER_ENTITY
    let modifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) as Record<string, number> | null
    if (!modifiers) {
      modifiers = createBaseSkillModifiers() as unknown as Record<string, number>
      this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, modifiers)
    }
  }

  applySkillChanges(skillChanges: Record<string, number> = {}, reason = 'unknown'): SkillChangeResult {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!skills) return { changed: false, reason, changes: {} }

    const validChanges: Record<string, { from: number; to: number; delta: number }> = {}
    for (const [key, value] of Object.entries(skillChanges)) {
      const rawValue = skills[key]
      const oldValue = this._extractLevel(rawValue)
      
      const newValue = this._clamp(oldValue + value, 0, 10)
      if (newValue !== oldValue) {
        // Сохраняем в правильной структуре
        if (typeof rawValue === 'object' && rawValue !== null) {
          skills[key] = { ...rawValue, level: newValue }
        } else {
          skills[key] = { level: newValue, xp: 0 }
        }
        validChanges[key] = { from: oldValue, to: newValue, delta: value }
      }
    }

    if (Object.keys(validChanges).length > 0) {
      this.recalculateModifiers()
      return { changed: true, reason, changes: validChanges }
    }

    return { changed: false, reason, changes: {} }
  }

  setSkillLevel(skillKey: string, level: number, reason = 'unknown'): void {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!skills) return

    const rawValue = skills[skillKey]
    const oldLevel = this._extractLevel(rawValue)
    
    const clampedLevel = this._clamp(level, 0, 10)
    
    // Сохраняем в правильной структуре
    if (typeof rawValue === 'object' && rawValue !== null) {
      skills[skillKey] = { ...rawValue, level: clampedLevel }
    } else {
      skills[skillKey] = { level: clampedLevel, xp: 0 }
    }

    if (clampedLevel !== oldLevel) {
      this.recalculateModifiers()
    }
  }

  recalculateModifiers(): void {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    let modifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) as Record<string, number> | null

    if (!modifiers) {
      modifiers = createBaseSkillModifiers() as unknown as Record<string, number>
      this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, modifiers)
    }

    // Преобразуем навыки в формат { key: level }
    const skillLevels: Record<string, number> = {}
    if (skills) {
      for (const [key, value] of Object.entries(skills)) {
        skillLevels[key] = this._extractLevel(value)
      }
    }

    const newModifiers = recalculateSkillModifiers(skillLevels) as unknown as Record<string, number>

    for (const key of Object.keys(newModifiers)) {
      modifiers[key] = newModifiers[key]
    }
  }

  getModifiers(): SkillModifiers {
    const playerId = PLAYER_ENTITY
    return (this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) || createBaseSkillModifiers()) as SkillModifiers
  }

  /**
   * Возвращает навыки в виде плоского { key: level }.
   * Извлекает level из shape { level, xp } или использует number как есть.
   */
  getSkills(): Record<string, number> | null {
    const playerId = PLAYER_ENTITY
    const raw = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!raw) return null

    const result: Record<string, number> = {}
    for (const [key, value] of Object.entries(raw)) {
      result[key] = this._extractLevel(value)
    }
    return result
  }

  hasSkillLevel(skillKey: string, requiredLevel: number): boolean {
    return this.getSkillLevel(skillKey) >= requiredLevel
  }

  getSkillLevel(skillKey: string): number {
    const playerId = PLAYER_ENTITY
    const raw = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!raw) return 0
    return this._extractLevel(raw[skillKey])
  }

  /**
   * Извлекает числовой уровень из значения навыка.
   * Поддерживает оба shape: number и { level, xp }.
   */
  _extractLevel(rawValue: { level?: number; xp?: number } | number | undefined): number {
    if (rawValue == null) return 0
    if (typeof rawValue === 'number') {
      telemetryInc('skill_shape_fallback')
      return rawValue
    }
    if (typeof rawValue === 'object') return rawValue.level ?? 0
    return 0
  }

  _clamp(value: number, min = 0, max = 10): number {
    return Math.max(min, Math.min(max, value))
  }
}

