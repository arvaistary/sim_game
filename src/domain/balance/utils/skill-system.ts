/**
 * Реалистичная система развития навыков с XP, возрастными множителями, деградацией и эффективностью обучения
 * Все механики добавлены как множители поверх существующей системы, обратная совместимость сохранена
 */

import type { SkillState, BurnoutResult, SkillStateWithStress, PlayerActivityState, LearningMethod } from './skill-system.types'

export type { SkillState, BurnoutResult, SkillStateWithStress, PlayerActivityState, LearningMethod }

export const SKILL_XP_TABLE: readonly number[] = Object.freeze([...Array(11)].map((_: undefined, n: number) => Math.floor(100 * Math.pow(1.3, n))))
export const MAX_XP: number = 10000
export const MAX_LEVEL: number = 10

/**
 * Возрастной множитель скорости обучения.
 * @description [Domain] - возвращает множитель XP в зависимости от возраста персонажа.
 * @return { number } множитель скорости обучения (0.3–2.5)
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
 * Множитель эффективности способа обучения.
 * @description [Domain] - возвращает множитель XP в зависимости от метода обучения (work, practice и т.д.).
 * @return { number } множитель эффективности (0.4–2.2)
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
 * Рассчитывает текущий уровень по общему XP.
 * @description [Domain] - определяет уровень навыка (0–10) на основе накопленного XP по таблице.
 * @return { number } уровень навыка от 0 до MAX_LEVEL
 */
export function calculateLevelFromXp(xp: number): number {
  const boundedXp: number = Math.max(0, Math.min(xp, MAX_XP))

  for (let level = MAX_LEVEL; level >= 0; level--) {
    if (boundedXp >= SKILL_XP_TABLE[level]!) {
      return level
    }
  }

  return 0
}

/**
 * Рассчитывает XP необходимый для достижения указанного уровня.
 * @description [Domain] - возвращает пороговое значение XP для заданного уровня по таблице.
 * @return { number } количество XP для уровня
 */
export function getXpForLevel(level: number): number {
  return SKILL_XP_TABLE[Math.max(0, Math.min(Math.floor(level), MAX_LEVEL))]!
}

/**
 * Рассчитывает множитель Зоны комфорта.
 * @description [Domain] - уменьшает XP при повторении одного и того же действия более 5 раз подряд.
 * @return { number } множитель от 0.2 до 1.0
 */
export function getComfortZoneMultiplier(consecutiveUses: number): number {
  if (consecutiveUses <= 5) return 1.0
  const penalty: number = (consecutiveUses - 5) * 0.15
  return Math.max(0.2, 1 - penalty)
}

/**
 * Рассчитывает множитель Перегорания.
 * @description [Domain] - снижает эффективность обучения и добавляет стресс при перегрузке (>30ч/неделю).
 * @return { BurnoutResult } множитель обучения и бонус стресса
 */
export function getBurnoutMultiplier(weeklyHours: number): BurnoutResult {

  if (weeklyHours <= 30) return { multiplier: 1.0, stressBonus: 0 }

  if (weeklyHours >= 50) return { multiplier: 0, stressBonus: 0.15 }

  const extraHours: number = weeklyHours - 30
  const penalty: number = extraHours * 0.05
  return {
    multiplier: Math.max(0, 1 - penalty),
    stressBonus: 0.15
  }
}

/**
 * Проверяет и сбрасывает зону комфорта если прошло достаточно времени.
 * @description [Domain] - обновляет счётчик последовательных использований навыка, сбрасывая при паузе >=7 дней.
 * @return { number } новое значение consecutiveUses
 */
function updateConsecutiveUses(state: SkillState, currentTimestamp: number): number {
  const daysSinceLastAction: number = currentTimestamp - state.lastActionAt

  if (daysSinceLastAction >= 7) {
    return 1
  }

  return state.consecutiveUses + 1
}

/**
 * Добавляет опыт к навыку с учетом всех множителей.
 * @description [Domain] - начисляет XP с учётом возраста, метода обучения, зоны комфорта и перегорания.
 * @return { SkillStateWithStress } новое состояние навыка с бонусом стресса
 */
export function addSkillXp(
  currentState: SkillState,
  baseXp: number,
  age: number,
  method: LearningMethod,
  currentTimestamp: number,
  activityState: PlayerActivityState,
  additionalMultipliers: number = 1.0
): SkillStateWithStress {
  const ageMultiplier: number = getAgeLearningMultiplier(age)
  const methodMultiplier: number = getLearningMethodMultiplier(method)
  const consecutiveUses: number = updateConsecutiveUses(currentState, currentTimestamp)
  const comfortZoneMultiplier: number = getComfortZoneMultiplier(consecutiveUses)
  const burnoutResult: BurnoutResult = getBurnoutMultiplier(activityState.weeklyLearningHours)
  const burnoutMultiplier: number = burnoutResult.multiplier
  const stressBonus: number = burnoutResult.stressBonus

  const totalMultiplier: number = ageMultiplier * methodMultiplier * comfortZoneMultiplier * burnoutMultiplier * additionalMultipliers
  const gainedXp: number = baseXp * totalMultiplier

  const newXp: number = Math.min(MAX_XP, currentState.xp + gainedXp)
  const newLevel: number = calculateLevelFromXp(newXp)

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
 * Рассчитывает деградацию неиспользуемого навыка.
 * @description [Domain] - уменьшает XP навыка при простое >30 дней, с порогом в 70% от пика.
 * @return { SkillState } обновлённое состояние навыка после деградации
 */
export function applySkillDecay(currentState: SkillState, currentTimestamp: number): SkillState {
  const daysSinceUsed: number = currentTimestamp - currentState.lastUsedAt

  if (daysSinceUsed <= 30) {
    return currentState
  }

  const decayDays: number = daysSinceUsed - 30
  const decayRatePerDay: number = 0.005 // 0.5% в день

  const maxAllowedXp: number = currentState.peakXp * 0.7
  const theoreticalDecayedXp: number = currentState.xp * Math.pow(1 - decayRatePerDay, decayDays)

  let newXp: number = Math.max(theoreticalDecayedXp, maxAllowedXp)

  // Навыки выше 7 уровня никогда не падают ниже 3 уровня
  const currentLevel: number = calculateLevelFromXp(currentState.peakXp)

  if (currentLevel >= 7) {
    const minXpForLevel3: number = getXpForLevel(3)
    newXp = Math.max(newXp, minXpForLevel3)
  }

  const newLevel: number = calculateLevelFromXp(newXp)

  return {
    ...currentState,
    xp: newXp,
    level: newLevel,
  }
}

/**
 * Инициализирует пустое состояние навыка.
 * @description [Domain] - создаёт начальное состояние навыка с нулевым XP и уровнем.
 * @return { SkillState } начальное состояние навыка
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
 * Конвертирует старый формат (только уровень) в новую систему состояния.
 * @description [Domain] - преобразует числовой уровень в SkillState с XP по таблице, для обратной совместимости.
 * @return { SkillState } состояние навыка, соответствующее указанному уровню
 */
export function convertLegacyLevelToSkillState(level: number, currentTimestamp: number): SkillState {
  const xp: number = getXpForLevel(level)
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
 * Обновляет состояние активности и перегорания при выполнении обучения.
 * @description [Domain] - обновляет счётчик учебных часов за неделю и сбрасывает перегорание при отдыхе.
 * @return { PlayerActivityState } обновлённое состояние активности игрока
 */
export function updateActivityState(
  state: PlayerActivityState,
  hoursSpent: number,
  currentTimestamp: number
): PlayerActivityState {
  const daysSinceWeekStart: number = currentTimestamp - state.weekStartTimestamp

  if (daysSinceWeekStart >= 7) {
    return {
      ...state,
      weeklyLearningHours: hoursSpent,
      weekStartTimestamp: currentTimestamp
    }
  }

  const daysSinceBurnout: number = currentTimestamp - state.burnoutRecoveryStart

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
 * Создает начальное состояние активности игрока.
 * @description [Domain] - инициализирует PlayerActivityState с нулевыми учебными часами.
 * @return { PlayerActivityState } начальное состояние активности
 */
export function createInitialActivityState(currentTimestamp: number): PlayerActivityState {
  return {
    weeklyLearningHours: 0,
    weekStartTimestamp: currentTimestamp,
    burnoutRecoveryStart: 0
  }
}

/**
 * Рассчитывает прогресс к следующему уровню в процентах 0-100.
 * @description [Domain] - вычисляет процент заполнения XP между текущим и следующим уровнем.
 * @return { number } прогресс в процентах от 0 до 100
 */
export function getLevelProgressPercent(xp: number): number {
  const currentLevel: number = calculateLevelFromXp(xp)

  if (currentLevel >= MAX_LEVEL) {
    return 100
  }

  const currentLevelXp: number = getXpForLevel(currentLevel)
  const nextLevelXp: number = getXpForLevel(currentLevel + 1)

  if (nextLevelXp === currentLevelXp) {
    return 0
  }

  return Math.floor(100 * ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)))
}
