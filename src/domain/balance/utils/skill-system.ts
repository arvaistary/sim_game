/**
 * Реалистичная система развития навыков с XP, возрастными множителями, деградацией и эффективностью обучения
 * Все механики добавлены как множители поверх существующей системы, обратная совместимость сохранена
 */

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

export const SKILL_XP_TABLE = Object.freeze([...Array(11)].map((_, n) => Math.floor(100 * Math.pow(1.3, n))))
export const MAX_XP = 10000
export const MAX_LEVEL = 10

/**
 * Возрастной множитель скорости обучения
 * @param age полных лет персонажа
 */
export function getAgeLearningMultiplier(age: number): number {
  if (age <= 7) return 2.5

  if (age <= 12) return 2.0

  if (age <= 18) return 1.7

  if (age <= 25) return 1.4

  if (age <= 35) return 1.1

  if (age <= 45) return 0.8

  if (age <= 60) return 0.5

  return 0.3
}

/**
 * Множитель эффективности способа обучения
 */
export function getLearningMethodMultiplier(method: LearningMethod): number {
  const multipliers: Record<LearningMethod, number> = {
    work: 2.2,
    practice: 1.5,
    courses: 1.0,
    books: 0.7,
    videos: 0.4,
  }

  return multipliers[method]
}

/**
 * Рассчитывает текущий уровень по общему XP
 */
export function calculateLevelFromXp(xp: number): number {
  const boundedXp = Math.max(0, Math.min(xp, MAX_XP))

  for (let level = MAX_LEVEL; level >= 0; level--) {
    if (boundedXp >= SKILL_XP_TABLE[level]) {
      return level
    }
  }

  return 0
}

/**
 * Рассчитывает XP необходимый для достижения указанного уровня
 */
export function getXpForLevel(level: number): number {
  return SKILL_XP_TABLE[Math.max(0, Math.min(Math.floor(level), MAX_LEVEL))]
}

/**
 * Рассчитывает множитель Зоны комфорта
 */
export function getComfortZoneMultiplier(consecutiveUses: number): number {
  if (consecutiveUses <= 5) return 1.0
  const penalty = (consecutiveUses - 5) * 0.15

  return Math.max(0.2, 1 - penalty)
}

/**
 * Рассчитывает множитель Перегорания
 */
export function getBurnoutMultiplier(weeklyHours: number): { multiplier: number; stressBonus: number } {
  if (weeklyHours <= 30) return { multiplier: 1.0, stressBonus: 0 }

  if (weeklyHours >= 50) return { multiplier: 0, stressBonus: 0.15 }

  const extraHours = weeklyHours - 30
  const penalty = extraHours * 0.05

  return {
    multiplier: Math.max(0, 1 - penalty),
    stressBonus: 0.15
  }
}

/**
 * Проверяет и сбрасывает зону комфорта если прошло достаточно времени
 */
function updateConsecutiveUses(state: SkillState, currentTimestamp: number): number {
  const daysSinceLastAction = currentTimestamp - state.lastActionAt

  if (daysSinceLastAction >= 7) {
    return 1
  }

  return state.consecutiveUses + 1
}

/**
 * Добавляет опыт к навыку с учетом всех множителей
 * @param currentState текущее состояние навыка
 * @param baseXp базовое количество XP до множителей
 * @param age возраст персонажа
 * @param method способ обучения
 * @param currentTimestamp текущий таймстемп в днях
 * @param activityState состояние активности игрока
 * @param additionalMultipliers дополнительные множители (существующие из системы модификаторов)
 */
export function addSkillXp(
  currentState: SkillState,
  baseXp: number,
  age: number,
  method: LearningMethod,
  currentTimestamp: number,
  activityState: PlayerActivityState,
  additionalMultipliers: number = 1.0
): SkillState & { stressGain: number } {
  const ageMultiplier = getAgeLearningMultiplier(age)
  const methodMultiplier = getLearningMethodMultiplier(method)
  const consecutiveUses = updateConsecutiveUses(currentState, currentTimestamp)
  const comfortZoneMultiplier = getComfortZoneMultiplier(consecutiveUses)
  const { multiplier: burnoutMultiplier, stressBonus } = getBurnoutMultiplier(activityState.weeklyLearningHours)

  const totalMultiplier = ageMultiplier * methodMultiplier * comfortZoneMultiplier * burnoutMultiplier * additionalMultipliers
  const gainedXp = baseXp * totalMultiplier

  const newXp = Math.min(MAX_XP, currentState.xp + gainedXp)
  const newLevel = calculateLevelFromXp(newXp)

  return {
    xp: newXp,
    level: newLevel,
    lastUsedAt: currentTimestamp,
    lastActionAt: currentTimestamp,
    consecutiveUses,
    peakXp: Math.max(currentState.peakXp, newXp),
    stressGain: stressBonus
  }
}

/**
 * Рассчитывает деградацию неиспользуемого навыка
 * @param currentState текущее состояние навыка
 * @param currentTimestamp текущий таймстемп в днях
 */
export function applySkillDecay(currentState: SkillState, currentTimestamp: number): SkillState {
  const daysSinceUsed = currentTimestamp - currentState.lastUsedAt

  if (daysSinceUsed <= 30) {
    return currentState
  }

  const decayDays = daysSinceUsed - 30
  const decayRatePerDay = 0.005 // 0.5% в день

  const maxAllowedXp = currentState.peakXp * 0.7
  const theoreticalDecayedXp = currentState.xp * Math.pow(1 - decayRatePerDay, decayDays)

  let newXp = Math.max(theoreticalDecayedXp, maxAllowedXp)

  // Навыки выше 7 уровня никогда не падают ниже 3 уровня
  const currentLevel = calculateLevelFromXp(currentState.peakXp)
  if (currentLevel >= 7) {
    const minXpForLevel3 = getXpForLevel(3)
    newXp = Math.max(newXp, minXpForLevel3)
  }

  const newLevel = calculateLevelFromXp(newXp)

  return {
    ...currentState,
    xp: newXp,
    level: newLevel,
  }
}

/**
 * Инициализирует пустое состояние навыка
 */
export function createEmptySkillState(currentTimestamp: number): SkillState {
  return {
    xp: 0,
    level: 0,
    lastUsedAt: currentTimestamp,
    lastActionAt: currentTimestamp,
    consecutiveUses: 0,
    peakXp: 0,
  }
}

/**
 * Конвертирует старый формат (только уровень) в новую систему состояния
 * Обратная совместимость
 */
export function convertLegacyLevelToSkillState(level: number, currentTimestamp: number): SkillState {
  const xp = getXpForLevel(level)

  return {
    xp,
    level,
    lastUsedAt: currentTimestamp,
    lastActionAt: currentTimestamp,
    consecutiveUses: 0,
    peakXp: xp,
  }
}

/**
 * Обновляет состояние активности и перегорания при выполнении обучения
 */
export function updateActivityState(
  state: PlayerActivityState,
  hoursSpent: number,
  currentTimestamp: number
): PlayerActivityState {
  const daysSinceWeekStart = currentTimestamp - state.weekStartTimestamp
  if (daysSinceWeekStart >= 7) {
    return {
      ...state,
      weeklyLearningHours: hoursSpent,
      weekStartTimestamp: currentTimestamp
    }
  }

  const daysSinceBurnout = currentTimestamp - state.burnoutRecoveryStart
  if (daysSinceBurnout >= 10) {
    return {
      ...state,
      weeklyLearningHours: state.weeklyLearningHours + hoursSpent,
      burnoutRecoveryStart: 0
    }
  }

  return {
    ...state,
    weeklyLearningHours: state.weeklyLearningHours + hoursSpent
  }
}

/**
 * Создает начальное состояние активности игрока
 */
export function createInitialActivityState(currentTimestamp: number): PlayerActivityState {
  return {
    weeklyLearningHours: 0,
    weekStartTimestamp: currentTimestamp,
    burnoutRecoveryStart: 0
  }
}

/**
 * Рассчитывает прогресс к следующему уровню в процентах 0-100
 */
export function getLevelProgressPercent(xp: number): number {
  const currentLevel = calculateLevelFromXp(xp)

  if (currentLevel >= MAX_LEVEL) {
    return 100
  }

  const currentLevelXp = getXpForLevel(currentLevel)
  const nextLevelXp = getXpForLevel(currentLevel + 1)

  if (nextLevelXp === currentLevelXp) {
    return 0
  }

  return Math.floor(100 * ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)))
}
