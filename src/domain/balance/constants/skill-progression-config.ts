/**
 * Конфигурация модели прогрессии навыков
 * Определяет, какая модель используется в системе
 */

export interface SkillProgressionConfig {
  /**
   * Активная модель прогрессии
   * - 'level-only': только уровни 0-10, без XP
   * - 'xp-realistic': полная XP модель с decay, burnout, возрастными множителями
   */
  activeModel: 'level-only' | 'xp-realistic'
  
  /**
   * Использовать ли двухконтурную модель (proficiencyScore 0-100 + displayLevel 0-10)
   */
  useTwoCircuitModel: boolean
  
  /**
   * Включить decay/forgetting неиспользуемых навыков
   */
  enableDecay: boolean
  
  /**
   * Включить burnout систему при интенсивном обучении
   */
  enableBurnout: boolean
  
  /**
   * Включить возрастные множители обучения
   */
  enableAgeMultipliers: boolean
  
  /**
   * Включить детские caps (ограничения навыков в детстве)
   */
  enableChildhoodCaps: boolean
}

/**
 * Конфигурация по умолчанию (XP реалистичная модель)
 */
export const DEFAULT_SKILL_PROGRESSION_CONFIG: SkillProgressionConfig = {
  activeModel: 'xp-realistic',
  useTwoCircuitModel: true,
  enableDecay: true,
  enableBurnout: true,
  enableAgeMultipliers: true,
  enableChildhoodCaps: true
}

/**
 * Конфигурация для level-only модели (обратная совместимость)
 */
export const LEVEL_ONLY_SKILL_PROGRESSION_CONFIG: SkillProgressionConfig = {
  activeModel: 'level-only',
  useTwoCircuitModel: false,
  enableDecay: false,
  enableBurnout: false,
  enableAgeMultipliers: false,
  enableChildhoodCaps: false
}

/**
 * Получить активную конфигурацию
 */
let currentConfig = DEFAULT_SKILL_PROGRESSION_CONFIG

export function getSkillProgressionConfig(): SkillProgressionConfig {
  return currentConfig
}

export function setSkillProgressionConfig(config: SkillProgressionConfig): void {
  currentConfig = config
}

/**
 * Проверить, активна ли XP модель
 */
export function isXpModelActive(): boolean {
  return getSkillProgressionConfig().activeModel === 'xp-realistic'
}

/**
 * Проверить, активна ли level-only модель
 */
export function isLevelOnlyModelActive(): boolean {
  return getSkillProgressionConfig().activeModel === 'level-only'
}

/**
 * Получить максимальный уровень навыка
 */
export function getMaxSkillLevel(): number {
  return 10
}

/**
 * Получить максимальный proficiency score (для двухконтурной модели)
 */
export function getMaxProficiencyScore(): number {
  return 100
}

/**
 * Конвертировать proficiency score в display level
 */
export function proficiencyScoreToDisplayLevel(score: number): number {
  const config = getSkillProgressionConfig()
  if (!config.useTwoCircuitModel) {
    return Math.min(getMaxSkillLevel(), Math.max(0, Math.floor(score)))
  }
  
  const maxScore = getMaxProficiencyScore()
  const maxLevel = getMaxSkillLevel()
  const normalizedScore = Math.min(maxScore, Math.max(0, score))
  return Math.floor((normalizedScore / maxScore) * maxLevel)
}

/**
 * Конвертировать display level в proficiency score
 */
export function displayLevelToProficiencyScore(level: number): number {
  const config = getSkillProgressionConfig()
  if (!config.useTwoCircuitModel) {
    return Math.min(getMaxSkillLevel(), Math.max(0, level))
  }
  
  const maxLevel = getMaxSkillLevel()
  const maxScore = getMaxProficiencyScore()
  const normalizedLevel = Math.min(maxLevel, Math.max(0, level))
  return Math.floor((normalizedLevel / maxLevel) * maxScore)
}