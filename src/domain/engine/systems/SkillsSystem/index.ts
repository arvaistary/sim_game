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
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    if (!skills) return { changed: false, reason, changes: {} }

    const validChanges: Record<string, { from: number; to: number; delta: number }> = {}
    for (const [key, value] of Object.entries(skillChanges)) {
      const oldValue = skills[key] ?? 0
      const newValue = this._clamp(oldValue + value, 0, 10)
      if (newValue !== oldValue) {
        skills[key] = newValue
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
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    if (!skills) return

    const clampedLevel = this._clamp(level, 0, 10)
    const oldLevel = skills[skillKey] ?? 0
    skills[skillKey] = clampedLevel

    if (clampedLevel !== oldLevel) {
      this.recalculateModifiers()
    }
  }

  recalculateModifiers(): void {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
    let modifiers = this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) as Record<string, number> | null

    if (!modifiers) {
      modifiers = createBaseSkillModifiers() as unknown as Record<string, number>
      this.world.addComponent(playerId, SKILL_MODIFIERS_COMPONENT, modifiers)
    }

    const newModifiers = recalculateSkillModifiers(skills || {}) as unknown as Record<string, number>

    for (const key of Object.keys(newModifiers)) {
      modifiers[key] = newModifiers[key]
    }
  }

  getModifiers(): SkillModifiers {
    const playerId = PLAYER_ENTITY
    return (this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) || createBaseSkillModifiers()) as SkillModifiers
  }

  getSkills(): Record<string, number> | null {
    const playerId = PLAYER_ENTITY
    return this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, number> | null
  }

  hasSkillLevel(skillKey: string, requiredLevel: number): boolean {
    const skills = this.getSkills()
    return (skills?.[skillKey] ?? 0) >= requiredLevel
  }

  getSkillLevel(skillKey: string): number {
    const skills = this.getSkills()
    return skills?.[skillKey] ?? 0
  }

  _clamp(value: number, min = 0, max = 10): number {
    return Math.max(min, Math.min(max, value))
  }
}

