import type { GameWorld } from '../../world'
import { PLAYER_ENTITY, TIME_COMPONENT, STATS_COMPONENT } from '../../components/index'
import type {
  SkillState,
  PlayerActivityState,
  LearningMethod
} from '../../../balance/utils/skill-system'
import {
  SKILL_XP_TABLE,
  MAX_XP,
  MAX_LEVEL,
  getAgeLearningMultiplier,
  getLearningMethodMultiplier,
  getComfortZoneMultiplier,
  getBurnoutMultiplier,
  calculateLevelFromXp,
  getXpForLevel,
  addSkillXp,
  applySkillDecay,
  createEmptySkillState,
  convertLegacyLevelToSkillState,
  updateActivityState,
  createInitialActivityState,
  getLevelProgressPercent
} from '../../../balance/utils/skill-system'
import { getSkillProgressionConfig } from '../../../balance/constants/skill-progression-config'

const SKILL_REALISM_COMPONENT = 'skillRealism'

export interface RealisticSkillState {
  skillStates: Record<string, SkillState>
  playerActivity: PlayerActivityState
  lastDecayCheckTimestamp: number
}

export class SkillsRealismModule {
  private world!: GameWorld
  private realismState: RealisticSkillState | null = null

  init(world: GameWorld): void {
    this.world = world
    this._loadOrCreateRealismState()
  }

  applyRealisticSkillChange(
    skillKey: string,
    baseXp: number,
    method: LearningMethod = 'practice',
    reason: string = 'unknown'
  ): { xpGained: number; stressGain: number; newLevel: number } | null {
    const config = getSkillProgressionConfig()
    if (!config.enableAgeMultipliers && !config.enableBurnout) {
      return null
    }

    if (!this.realismState) {
      this._loadOrCreateRealismState()
      if (!this.realismState) return null
    }

    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as { timestamp: number } | null
    const stats = this.world.getComponent(playerId, STATS_COMPONENT) as { age?: number } | null
    
    if (!time || !stats) return null

    const currentTimestamp = time.timestamp
    const age = stats.age ?? 25
    const currentState = this.realismState.skillStates[skillKey] || createEmptySkillState(currentTimestamp)

    const hoursSpent = this._estimateHoursForMethod(method)
    this.realismState.playerActivity = updateActivityState(
      this.realismState.playerActivity,
      hoursSpent,
      currentTimestamp
    )

    const newState = addSkillXp(
      currentState,
      baseXp,
      age,
      method,
      currentTimestamp,
      this.realismState.playerActivity,
      1.0
    )

    this.realismState.skillStates[skillKey] = newState
    this._saveRealismState()

    return {
      xpGained: newState.xp - currentState.xp,
      stressGain: newState.stressGain,
      newLevel: newState.level
    }
  }

  applySkillDecay(): Record<string, { xpLost: number; levelChange: number }> {
    const config = getSkillProgressionConfig()
    if (!config.enableDecay) return {}

    if (!this.realismState) {
      this._loadOrCreateRealismState()
      if (!this.realismState) return {}
    }

    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as { timestamp: number } | null
    if (!time) return {}

    const currentTimestamp = time.timestamp
    const daysSinceLastCheck = currentTimestamp - this.realismState.lastDecayCheckTimestamp
    
    if (daysSinceLastCheck < 7) return {}

    const decayResults: Record<string, { xpLost: number; levelChange: number }> = {}

    for (const [skillKey, state] of Object.entries(this.realismState.skillStates)) {
      const newState = applySkillDecay(state, currentTimestamp)
      
      if (newState.xp !== state.xp) {
        decayResults[skillKey] = {
          xpLost: state.xp - newState.xp,
          levelChange: state.level - newState.level
        }
        this.realismState.skillStates[skillKey] = newState
      }
    }

    this.realismState.lastDecayCheckTimestamp = currentTimestamp
    this._saveRealismState()

    return decayResults
  }

  getSkillState(skillKey: string): SkillState | null {
    if (!this.realismState) {
      this._loadOrCreateRealismState()
    }
    return this.realismState?.skillStates[skillKey] || null
  }

  getSkillProgressPercent(skillKey: string): number {
    const state = this.getSkillState(skillKey)
    if (!state) return 0
    return getLevelProgressPercent(state.xp)
  }

  convertLegacySkills(legacySkills: Record<string, number>): void {
    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as { timestamp: number } | null
    if (!time) return

    if (!this.realismState) {
      this._loadOrCreateRealismState()
    }

    const currentTimestamp = time.timestamp
    
    for (const [skillKey, level] of Object.entries(legacySkills)) {
      if (!this.realismState!.skillStates[skillKey]) {
        this.realismState!.skillStates[skillKey] = convertLegacyLevelToSkillState(level, currentTimestamp)
      }
    }

    this._saveRealismState()
  }

  syncWithMainSkills(mainSkills: Record<string, { level?: number; xp?: number } | number>): void {
    if (!this.realismState) return

    const playerId = PLAYER_ENTITY
    const time = this.world.getComponent(playerId, TIME_COMPONENT) as { timestamp: number } | null
    if (!time) return

    const currentTimestamp = time.timestamp

    for (const [skillKey, mainValue] of Object.entries(mainSkills)) {
      let mainXp = 0
      
      if (typeof mainValue === 'object' && mainValue !== null) {
        mainXp = mainValue.xp ?? (mainValue.level ?? 0) * 10
      } else if (typeof mainValue === 'number') {
        mainXp = mainValue * 10
      }

      const realismState = this.realismState.skillStates[skillKey]
      if (!realismState) {
        this.realismState.skillStates[skillKey] = {
          xp: mainXp,
          level: calculateLevelFromXp(mainXp),
          lastUsedAt: currentTimestamp,
          lastActionAt: currentTimestamp,
          consecutiveUses: 0,
          peakXp: mainXp
        }
      } else if (Math.abs(realismState.xp - mainXp) > 1) {
        realismState.xp = mainXp
        realismState.level = calculateLevelFromXp(mainXp)
        realismState.peakXp = Math.max(realismState.peakXp, mainXp)
      }
    }

    this._saveRealismState()
  }

  private _loadOrCreateRealismState(): void {
    const playerId = PLAYER_ENTITY
    const existing = this.world.getComponent(playerId, SKILL_REALISM_COMPONENT) as RealisticSkillState | null
    if (existing && typeof existing === 'object' && existing.skillStates) {
      this.realismState = existing
      return
    }

    const time = this.world.getComponent(playerId, TIME_COMPONENT) as { timestamp: number } | null
    if (!time) {
      this.realismState = null
      return
    }

    const currentTimestamp = time.timestamp
    this.realismState = {
      skillStates: {},
      playerActivity: createInitialActivityState(currentTimestamp),
      lastDecayCheckTimestamp: currentTimestamp,
    }
    this._persistToComponent()
  }

  private _saveRealismState(): void {
    this._persistToComponent()
  }

  private _persistToComponent(): void {
    if (!this.realismState) return
    const playerId = PLAYER_ENTITY
    const existing = this.world.getComponent(playerId, SKILL_REALISM_COMPONENT)
    if (existing) {
      this.world.updateComponent(playerId, SKILL_REALISM_COMPONENT, this.realismState as unknown as Record<string, unknown>)
    } else {
      this.world.addComponent(playerId, SKILL_REALISM_COMPONENT, this.realismState as unknown as Record<string, unknown>)
    }
  }

  private _estimateHoursForMethod(method: LearningMethod): number {
    const hoursByMethod: Record<LearningMethod, number> = {
      work: 8,
      practice: 2,
      courses: 3,
      books: 1,
      videos: 0.5
    }
    return hoursByMethod[method] || 1
  }
}