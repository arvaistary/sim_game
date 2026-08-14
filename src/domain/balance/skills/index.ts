export type { SkillProgressionStep } from './skill-progression'
export {
  MAX_SKILL_LEVEL,
  MAX_SKILL_XP,
  SKILL_XP_THRESHOLDS,
  getLevelFromXp,
  getSkillProgressionTable,
  getXpForLevel,
  getXpToNextLevel,
  normalizeSkillLevels,
} from './skill-progression'
export type { SkillEntry } from './skill-progression'
export type { SkillLevelInput } from './skill-progression'

export type { LearningMethod } from './learning-methods'
export {
  DEFAULT_LEARNING_METHOD,
  LEARNING_METHOD_MULTIPLIERS,
  getLearningMethodMultiplier,
} from './learning-methods'

export type { SkillXpDistributionInput, SkillXpGainInput } from './skill-xp'
export {
  calculateSkillXpGain,
  distributeSkillXp,
  getAgeLearningMultiplier,
} from './skill-xp'
