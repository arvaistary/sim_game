import type {
  DeathCause,
  EndingType,
  LifeScore,
  LifeScoreCriteria,
  LifeState,
  LifeSummary,
} from './life.types'
import { cloneLifeState } from './life-clone'

const DEATH_CAUSES: ReadonlySet<string> = new Set<string>([
  'natural_old_age',
  'illness',
  'accident',
  'depression',
  'exhaustion',
])

const ENDING_TYPES: ReadonlySet<string> = new Set<string>([
  'unfulfilled_life',
  'ordinary_life',
  'successful_career',
  'happy_family',
  'legendary_life',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isDeathCause(value: unknown): value is DeathCause {
  return typeof value === 'string' && DEATH_CAUSES.has(value)
}

function isEndingType(value: unknown): value is EndingType {
  return typeof value === 'string' && ENDING_TYPES.has(value)
}

function isLifeScoreCriteria(value: unknown): value is LifeScoreCriteria {
  if (!isRecord(value)) return false

  return isFiniteNumber(value.age)
    && isFiniteNumber(value.money)
    && isFiniteNumber(value.comfort)
    && isFiniteNumber(value.skills)
    && isFiniteNumber(value.family)
    && isFiniteNumber(value.achievements)
}

function isLifeScore(value: unknown): value is LifeScore {
  if (!isRecord(value)) return false

  return isFiniteNumber(value.total)
    && isFiniteNumber(value.stars)
    && isLifeScoreCriteria(value.criteria)
}

function isLifeSummary(value: unknown): value is LifeSummary {
  if (!isRecord(value)) return false

  const finance: unknown = value.finance
  const career: unknown = value.career
  const family: unknown = value.family
  const housing: unknown = value.housing
  const hobbies: unknown = value.hobbies
  const topSkills: unknown = value.topSkills

  if (!isRecord(finance) || !isRecord(career) || !isRecord(family) || !isRecord(housing) || !isRecord(hobbies)) return false

  if (!Array.isArray(topSkills)) return false

  return typeof value.playerName === 'string'
    && isFiniteNumber(value.ageAtDeath)
    && isFiniteNumber(value.gameDays)
    && isFiniteNumber(value.gameHours)
    && isDeathCause(value.deathCause)
    && typeof value.deathCauseLabel === 'string'
    && isEndingType(value.endingType)
    && typeof value.endingTitle === 'string'
    && isLifeScore(value.score)
    && isFiniteNumber(finance.moneyAtDeath)
    && isFiniteNumber(finance.maxMoney)
    && isFiniteNumber(finance.totalEarnings)
    && isFiniteNumber(finance.totalSpent)
    && typeof career.highestJob === 'string'
    && isFiniteNumber(career.maxSalaryPerWeek)
    && isFiniteNumber(career.promotions)
    && isFiniteNumber(career.totalWorkDays)
    && isFiniteNumber(career.totalWorkHours)
    && isFiniteNumber(career.careerLevel)
    && topSkills.every((skill: unknown) => isRecord(skill) && typeof skill.id === 'string' && isFiniteNumber(skill.level))
    && isFiniteNumber(family.relationshipCount)
    && isFiniteNumber(family.childrenCount)
    && isFiniteNumber(family.marriages)
    && isFiniteNumber(family.maxRelationshipLevel)
    && isFiniteNumber(housing.maxLevel)
    && isFiniteNumber(housing.comfortAtDeath)
    && isFiniteNumber(value.possessions)
    && isFiniteNumber(value.achievements)
    && isFiniteNumber(hobbies.mastered)
    && isFiniteNumber(hobbies.maxLevel)
    && isFiniteNumber(hobbies.collections)
}

/**
 * Нормализовать состояние жизненного цикла на границе persistence.
 * @description [Domain] - не допускает terminal state без полной причины и отчёта.
 * @param value непроверенное сохранённое значение
 * @return { LifeState } безопасное состояние жизненного цикла
 */
export function normalizeLifeState(value: unknown): LifeState {
  if (!isRecord(value)) return { status: 'active', lowMoodDays: 0, deathCause: null, summary: null }

  const lowMoodDays: number = isFiniteNumber(value.lowMoodDays)
    ? Math.max(0, Math.floor(value.lowMoodDays))
    : 0
  const deathCause: DeathCause | null = isDeathCause(value.deathCause) ? value.deathCause : null
  const summary: LifeSummary | null = isLifeSummary(value.summary) && value.summary.deathCause === deathCause
    ? value.summary
    : null

  if (value.status === 'ended' && deathCause !== null && summary !== null) {
    return cloneLifeState({ status: 'ended', lowMoodDays, deathCause, summary })
  }

  return { status: 'active', lowMoodDays, deathCause: null, summary: null }
}
