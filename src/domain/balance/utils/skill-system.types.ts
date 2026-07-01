export interface SkillState {
  xp: number
  level: number
  lastUsedAt: number
  peakXp: number
  consecutiveUses: number
  lastActionAt: number
}

export interface BurnoutResult {
  multiplier: number
  stressBonus: number
}

export interface SkillStateWithStress extends SkillState {
  stressGain: number
}

export interface PlayerActivityState {
  weeklyLearningHours: number
  weekStartTimestamp: number
  burnoutRecoveryStart: number
}

export type LearningMethod = 'work' | 'practice' | 'courses' | 'books' | 'videos'
