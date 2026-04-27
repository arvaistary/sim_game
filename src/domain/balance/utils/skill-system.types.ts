export interface SkillState {
  xp: number
  level: number
  lastUsedAt: number
  peakXp: number
  consecutiveUses: number
  lastActionAt: number
}

export interface PlayerActivityState {
  weeklyLearningHours: number
  weekStartTimestamp: number
  burnoutRecoveryStart: number
}

export type LearningMethod = 'work' | 'practice' | 'courses' | 'books' | 'videos'

export type GetBurnoutMultiplierReturn = {
  multiplier: number
  stressBonus: number
}

export interface AddSkillXpInput {
  currentState: SkillState
  baseXp: number
  age: number
  method: LearningMethod
  currentTimestamp: number
  activityState: PlayerActivityState
  additionalMultipliers?: number
}

export interface AddSkillXpResult extends SkillState {
  stressGain: number
}