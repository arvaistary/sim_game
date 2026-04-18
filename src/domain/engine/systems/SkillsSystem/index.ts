import { telemetryInc } from '../../utils/telemetry'
import { SKILLS_COMPONENT, SKILL_MODIFIERS_COMPONENT, PLAYER_ENTITY } from '../../components/index'
import { recalculateSkillModifiers, createBaseSkillModifiers } from '../../../balance/constants/skill-modifiers'
import { getSkillProgressionConfig, isXpModelActive, proficiencyScoreToDisplayLevel } from '../../../balance/constants/skill-progression-config'
import { SkillsRealismModule } from './index.realism'
import type { GameWorld } from '../../world'
import type { SkillModifiers } from '@/domain/balance/types'
import type { SkillChangeResult } from './index.types'
import { TagsSystem } from '../TagsSystem'

export class SkillsSystem {
  private world!: GameWorld
  private realismModule!: SkillsRealismModule

  init(world: GameWorld): void {
    this.world = world
    this.realismModule = new SkillsRealismModule()
    this.realismModule.init(world)
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

    const config = getSkillProgressionConfig()
    const validChanges: Record<string, { from: number; to: number; delta: number }> = {}
    
    for (const [key, delta] of Object.entries(skillChanges)) {
      const oldDisplayLevel = this.getSkillLevel(key)
      
      if (isXpModelActive()) {
        // XP модель с реализм��м
        let newDisplayLevel = oldDisplayLevel
        
        if (config.enableAgeMultipliers || config.enableBurnout) {
          // Используем реалистичную модель с множителями
          const realismResult = this.realismModule.applyRealisticSkillChange(
            key,
            delta,
            this._inferLearningMethodFromReason(reason),
            reason
          )
          
          if (realismResult) {
            newDisplayLevel = proficiencyScoreToDisplayLevel(
              (this._getSkillXp(key) || 0) + realismResult.xpGained
            )
          }
        } else {
          // Базовая XP модель без множителей
          const newState = this._applyXpChange(key, delta, reason)
          if (newState) {
            newDisplayLevel = proficiencyScoreToDisplayLevel(newState.xp)
          }
        }
        
        if (newDisplayLevel !== oldDisplayLevel) {
          validChanges[key] = { from: oldDisplayLevel, to: newDisplayLevel, delta }
        }
      } else {
        // Level-only модель: просто добавляем к уровню
        const newValue = this._clamp(oldDisplayLevel + delta, 0, 10)
        if (newValue !== oldDisplayLevel) {
          this._setSkillValue(key, newValue)
          validChanges[key] = { from: oldDisplayLevel, to: newValue, delta }
        }
      }
    }

    if (Object.keys(validChanges).length > 0) {
      this.recalculateModifiers()
      return { changed: true, reason, changes: validChanges }
    }

    return { changed: false, reason, changes: {} }
  }

  setSkillLevel(skillKey: string, level: number, reason = 'unknown'): void {
    const oldLevel = this.getSkillLevel(skillKey)
    const clampedLevel = this._clamp(level, 0, 10)
    
    if (clampedLevel !== oldLevel) {
      this._setSkillValue(skillKey, clampedLevel)
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
    const base: SkillModifiers = (this.world.getComponent(playerId, SKILL_MODIFIERS_COMPONENT) ||
      createBaseSkillModifiers()) as SkillModifiers
    const tagsSystem = this.world.getSystem(TagsSystem)
    if (!tagsSystem) return base
    const fromTags: Partial<SkillModifiers> = tagsSystem.calculateCombinedModifiers()
    return this._mergeSkillModifiers(base, fromTags)
  }

  _mergeSkillModifiers(base: SkillModifiers, delta: Partial<SkillModifiers>): SkillModifiers {
    const out: SkillModifiers = { ...base }
    for (const key of Object.keys(delta) as (keyof SkillModifiers)[]) {
      const d = delta[key]
      if (typeof d !== 'number') continue
      const prev = out[key]
      if (typeof prev === 'number') {
        out[key] = prev + d
      }
    }
    return out
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
   * Для XP модели конвертирует XP в display level.
   */
  _extractLevel(rawValue: { level?: number; xp?: number } | number | undefined): number {
    if (rawValue == null) return 0
    
    if (typeof rawValue === 'number') {
      telemetryInc('skill_shape_fallback')
      return rawValue
    }
    
    if (typeof rawValue === 'object') {
      if (isXpModelActive() && rawValue.xp !== undefined) {
        // Для XP модели используем proficiency score для расчёта display level
        return proficiencyScoreToDisplayLevel(rawValue.xp)
      }
      return rawValue.level ?? 0
    }
    
    return 0
  }

  /**
   * Устанавливает значение навыка в правильной структуре.
   */
  _setSkillValue(skillKey: string, level: number): void {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!skills) return

    const rawValue = skills[skillKey]
    
    if (typeof rawValue === 'object' && rawValue !== null) {
      skills[skillKey] = { ...rawValue, level }
    } else {
      skills[skillKey] = { level, xp: 0 }
    }
  }

  /**
   * Применяет изменение XP к навыку (для XP модели)
   */
  _applyXpChange(skillKey: string, xpDelta: number, reason: string): { xp: number; level: number } | null {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!skills) return null

    const rawValue = skills[skillKey]
    let currentXp = 0
    let currentLevel = 0
    
    if (typeof rawValue === 'object' && rawValue !== null) {
      currentXp = rawValue.xp ?? 0
      currentLevel = rawValue.level ?? 0
    } else if (typeof rawValue === 'number') {
      currentLevel = rawValue
      // Конвертируем уровень в XP (обратная совместимость)
      currentXp = currentLevel * 10 // 10 XP за уровень
    }
    
    const newXp = Math.max(0, Math.min(100, currentXp + xpDelta))
    const newDisplayLevel = proficiencyScoreToDisplayLevel(newXp)
    
    skills[skillKey] = { level: newDisplayLevel, xp: newXp }
    
    return { xp: newXp, level: newDisplayLevel }
  }

  /**
   * Получить XP навыка
   */
  _getSkillXp(skillKey: string): number {
    const playerId = PLAYER_ENTITY
    const skills = this.world.getComponent(playerId, SKILLS_COMPONENT) as Record<string, { level?: number; xp?: number } | number> | null
    if (!skills) return 0

    const rawValue = skills[skillKey]
    if (typeof rawValue === 'object' && rawValue !== null) {
      return rawValue.xp ?? 0
    } else if (typeof rawValue === 'number') {
      return rawValue * 10 // Конвертация для обратной совместимости
    }
    return 0
  }

  /**
   * Определить метод обучения по причине изменения
   */
  _inferLearningMethodFromReason(reason: string): 'work' | 'practice' | 'courses' | 'books' | 'videos' {
    const reasonLower = reason.toLowerCase()
    
    if (reasonLower.includes('work') || reasonLower.includes('job') || reasonLower.includes('career')) {
      return 'work'
    } else if (reasonLower.includes('course') || reasonLower.includes('education') || reasonLower.includes('study')) {
      return 'courses'
    } else if (reasonLower.includes('book') || reasonLower.includes('read')) {
      return 'books'
    } else if (reasonLower.includes('video') || reasonLower.includes('watch')) {
      return 'videos'
    }
    
    return 'practice' // по умолчанию
  }

  /**
   * Применить decay к навыкам (вызывается из TimeSystem)
   */
  applySkillDecay(): void {
    const config = getSkillProgressionConfig()
    if (!config.enableDecay) return

    const decayResults = this.realismModule.applySkillDecay()
    
    if (Object.keys(decayResults).length > 0) {
      // Обновляем основные навыки на основе decay
      for (const [skillKey, result] of Object.entries(decayResults)) {
        if (result.levelChange !== 0) {
          const currentLevel = this.getSkillLevel(skillKey)
          const newLevel = Math.max(0, currentLevel - result.levelChange)
          this._setSkillValue(skillKey, newLevel)
        }
      }
      
      this.recalculateModifiers()
    }
  }

  /**
   * Получить прогресс навыка в процентах (для UI)
   */
  getSkillProgressPercent(skillKey: string): number {
    const config = getSkillProgressionConfig()
    if (!isXpModelActive()) {
      // Для level-only модели нет прогресса внутри уровня
      return 0
    }
    
    return this.realismModule.getSkillProgressPercent(skillKey)
  }

  _clamp(value: number, min = 0, max = 10): number {
    return Math.max(min, Math.min(max, value))
  }
}

