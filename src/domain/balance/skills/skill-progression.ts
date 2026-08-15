import type { SkillProgressionStep } from './skill-progression.types'
import type { SkillEntry, SkillLevelInput } from './skill-entry.types'

export type { SkillProgressionStep } from './skill-progression.types'
export type { SkillEntry } from './skill-entry.types'
export type { SkillLevelInput } from './skill-entry.types'

/** Максимальный уровень навыка. */
export const MAX_SKILL_LEVEL: number = 10

/** Кумулятивные пороги опыта; индекс массива равен уровню. */
export const SKILL_XP_THRESHOLDS: readonly number[] = Object.freeze([
  0,
  50,
  150,
  350,
  700,
  1250,
  2100,
  3300,
  5000,
  7300,
  10000,
])

/** Опыт, соответствующий максимальному уровню. */
export const MAX_SKILL_XP: number = SKILL_XP_THRESHOLDS[MAX_SKILL_LEVEL]!

/**
 * Возвращает кумулятивный опыт для уровня.
 * @description [Domain] - ограничивает уровень диапазоном 0..MAX_SKILL_LEVEL.
 * @return { number } кумулятивный опыт
 */
export function getXpForLevel(level: number): number {
  const boundedLevel: number = Math.max(0, Math.min(Math.floor(level), MAX_SKILL_LEVEL))

  return SKILL_XP_THRESHOLDS[boundedLevel]!
}

/**
 * Возвращает уровень по накопленному опыту.
 * @description [Domain] - возвращает целый уровень 0..MAX_SKILL_LEVEL.
 * @return { number } уровень навыка
 */
export function getLevelFromXp(xp: number): number {
  const boundedXp: number = Math.max(0, Math.min(xp, MAX_SKILL_XP))

  for (let level: number = MAX_SKILL_LEVEL; level > 0; level -= 1) {
    if (boundedXp >= SKILL_XP_THRESHOLDS[level]!) return level
  }

  return 0
}

/**
 * Возвращает опыт до следующего уровня.
 * @description [Domain] - на максимальном уровне возвращает 0.
 * @return { number } недостающий опыт
 */
export function getXpToNextLevel(xp: number): number {
  const currentLevel: number = getLevelFromXp(xp)

  if (currentLevel >= MAX_SKILL_LEVEL) return 0

  return SKILL_XP_THRESHOLDS[currentLevel + 1]! - Math.max(0, xp)
}

/**
 * Возвращает таблицу стоимости уровней.
 * @description [Domain] - собирает уровни от 1 до MAX_SKILL_LEVEL.
 * @return { SkillProgressionStep[] } таблица прогрессии
 */
export function getSkillProgressionTable(): SkillProgressionStep[] {
  const steps: SkillProgressionStep[] = []

  for (let level: number = 1; level <= MAX_SKILL_LEVEL; level += 1) {
    steps.push({
      level,
      levelCost: SKILL_XP_THRESHOLDS[level]! - SKILL_XP_THRESHOLDS[level - 1]!,
      totalXp: SKILL_XP_THRESHOLDS[level]!,
    })
  }

  return steps
}

/**
 * Приводит записи навыков к объектной форме.
 * @description [Domain] - восстанавливает опыт числового legacy-уровня по таблице порогов.
 * @return { Record<string, SkillEntry> } нормализованные записи навыков
 */
export function normalizeSkillLevels(raw: Record<string, SkillLevelInput>): Record<string, SkillEntry> {
  const normalized: Record<string, SkillEntry> = {}

  for (const [skillKey, entry] of Object.entries(raw)) {
    if (typeof entry === 'number') {
      const level: number = Math.max(0, Math.min(Math.round(entry), MAX_SKILL_LEVEL))
      normalized[skillKey] = { level, xp: getXpForLevel(level) }
      continue
    }

    normalized[skillKey] = { level: entry.level, xp: entry.xp }
  }

  return normalized
}
