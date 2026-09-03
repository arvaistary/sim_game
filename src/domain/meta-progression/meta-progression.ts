import type { DeathCause, LifeSummary } from '@/domain/game-world/life'
import type { MetaProgression, NewGamePlusTransfer } from './meta-progression.types'

const DEATH_CAUSES: readonly DeathCause[] = [
  'natural_old_age',
  'illness',
  'accident',
  'depression',
  'exhaustion',
]

const NEW_GAME_PLUS_MONEY_RATE: number = 0.15
const NEW_GAME_PLUS_SKILL_LIMIT: number = 2

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonNegativeInteger(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback
}

function nonNegativeNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return [...new Set(value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0))]
}

function normalizeNumberMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}

  const normalized: Record<string, number> = {}
  for (const [key, entry] of Object.entries(value)) {
    if (key && typeof entry === 'number' && Number.isFinite(entry) && entry >= 0) {
      normalized[key] = Math.floor(entry)
    }
  }
  return normalized
}

function createDeathCauseCounts(): Record<DeathCause, number> {
  return Object.fromEntries(DEATH_CAUSES.map(cause => [cause, 0])) as Record<DeathCause, number>
}

/**
 * Создать начальное мета-состояние новой игры.
 * @description [Domain] - возвращает независимый пустой aggregate meta-progression.
 * @return { MetaProgression } начальное состояние
 */
export function createInitialMetaProgression(): MetaProgression {
  return {
    livesCompleted: 0,
    newGamePlusCount: 0,
    totalGameDays: 0,
    totalGameHours: 0,
    totalEarnings: 0,
    totalWorkHours: 0,
    totalEvents: 0,
    bestAge: 0,
    bestScore: 0,
    deathCauseCounts: createDeathCauseCounts(),
    bestSkillLevels: {},
    unlockedAchievements: [],
    revealedKnowledge: [],
    pendingTransfer: { money: 0, skills: {} },
  }
}

/**
 * Нормализовать непроверенный meta snapshot на границе persistence.
 * @description [Domain] - отбрасывает повреждённые значения и добавляет отсутствующие поля.
 * @return { MetaProgression } безопасное состояние
 */
export function normalizeMetaProgression(value: unknown): MetaProgression {
  const initial: MetaProgression = createInitialMetaProgression()

  if (!isRecord(value)) return initial

  const deathCauseCounts: Record<DeathCause, number> = createDeathCauseCounts()

  if (isRecord(value.deathCauseCounts)) {
    for (const cause of DEATH_CAUSES) {
      deathCauseCounts[cause] = nonNegativeInteger(value.deathCauseCounts[cause])
    }
  }

  const rawTransfer: Record<string, unknown> = isRecord(value.pendingTransfer) ? value.pendingTransfer : {}
  const rawSkills: unknown = rawTransfer.skills

  return {
    livesCompleted: nonNegativeInteger(value.livesCompleted),
    newGamePlusCount: nonNegativeInteger(value.newGamePlusCount),
    totalGameDays: nonNegativeInteger(value.totalGameDays),
    totalGameHours: nonNegativeNumber(value.totalGameHours),
    totalEarnings: nonNegativeNumber(value.totalEarnings),
    totalWorkHours: nonNegativeNumber(value.totalWorkHours),
    totalEvents: nonNegativeInteger(value.totalEvents),
    bestAge: nonNegativeNumber(value.bestAge),
    bestScore: nonNegativeNumber(value.bestScore),
    deathCauseCounts,
    bestSkillLevels: normalizeNumberMap(value.bestSkillLevels),
    unlockedAchievements: normalizeStringList(value.unlockedAchievements),
    revealedKnowledge: normalizeStringList(value.revealedKnowledge),
    pendingTransfer: {
      money: nonNegativeNumber(rawTransfer.money),
      skills: normalizeNumberMap(rawSkills),
    },
  }
}

/**
 * Скопировать мета-состояние без общих вложенных ссылок.
 * @description [Domain] - создаёт независимый snapshot для aggregate и persistence.
 * @return { MetaProgression } копия состояния
 */
export function cloneMetaProgression(meta: MetaProgression): MetaProgression {
  return {
    ...meta,
    deathCauseCounts: { ...meta.deathCauseCounts },
    bestSkillLevels: { ...meta.bestSkillLevels },
    unlockedAchievements: [...meta.unlockedAchievements],
    revealedKnowledge: [...meta.revealedKnowledge],
    pendingTransfer: {
      money: meta.pendingTransfer.money,
      skills: { ...meta.pendingTransfer.skills },
    },
  }
}

/**
 * Добавить итог завершённой жизни и подготовить одноразовый New Game+ transfer.
 * @description [Domain] - агрегирует статистику и готовит перенос для следующей жизни.
 * @return { void }
 */
export function recordCompletedLife(meta: MetaProgression, summary: LifeSummary, totalEvents: number): void {
  meta.livesCompleted += 1
  meta.totalGameDays += summary.gameDays
  meta.totalGameHours += summary.gameHours
  meta.totalEarnings += summary.finance.totalEarnings
  meta.totalWorkHours += summary.career.totalWorkHours
  meta.totalEvents += nonNegativeInteger(totalEvents)
  meta.bestAge = Math.max(meta.bestAge, summary.ageAtDeath)
  meta.bestScore = Math.max(meta.bestScore, summary.score.total)
  meta.deathCauseCounts[summary.deathCause] += 1

  for (const skill of summary.topSkills) {
    meta.bestSkillLevels[skill.id] = Math.max(meta.bestSkillLevels[skill.id] ?? 0, skill.level)
  }

  meta.pendingTransfer = {
    money: Math.floor(Math.max(0, summary.finance.moneyAtDeath) * NEW_GAME_PLUS_MONEY_RATE),
    skills: Object.fromEntries(
      summary.topSkills
        .filter(skill => Math.floor(skill.level / 2) > 0)
        .slice(0, NEW_GAME_PLUS_SKILL_LIMIT)
        .map(skill => [skill.id, Math.floor(skill.level / 2)]),
    ),
  }
}

/**
 * Забрать transfer для новой жизни и очистить его после использования.
 * @description [Domain] - делает одноразовый перенос и увеличивает счётчик New Game+.
 * @return { NewGamePlusTransfer } данные переноса
 */
export function consumeNewGamePlusTransfer(meta: MetaProgression): NewGamePlusTransfer {
  const transfer: NewGamePlusTransfer = {
    money: meta.pendingTransfer.money,
    skills: { ...meta.pendingTransfer.skills },
  }
  meta.newGamePlusCount += 1
  meta.pendingTransfer = { money: 0, skills: {} }
  return transfer
}
