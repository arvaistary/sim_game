/** Миграция сохранённого опыта навыков на нелинейные пороги. */
import { MAX_SKILL_LEVEL, getXpForLevel } from '@/domain/balance/skills'
import type { SkillMigrationResult } from './save-skill-migration.types'

export type { SkillMigrationResult } from './save-skill-migration.types'

/** Версия схемы навыков в сохранении. */
export const SKILL_SCHEMA_VERSION: number = 1

function readLegacyLevel(entry: unknown): number | null {
  if (typeof entry === 'number') return Number.isFinite(entry) ? entry : null

  if (typeof entry !== 'object' || entry === null) return null

  const record: Record<string, unknown> = entry as Record<string, unknown>

  if (typeof record.level === 'number' && Number.isFinite(record.level)) return record.level

  if (typeof record.xp === 'number' && Number.isFinite(record.xp)) return record.xp / 100

  return null
}

function readSkillsBucket(payload: Record<string, unknown>): Record<string, unknown> | null {
  const outer: unknown = payload.skills

  if (typeof outer !== 'object' || outer === null) return null

  const inner: unknown = (outer as Record<string, unknown>).skills

  if (typeof inner !== 'object' || inner === null) return null

  return inner as Record<string, unknown>
}

/**
 * Переводит сохранённые навыки на новые пороги опыта.
 * @description [Infrastructure] - мутирует payload in-place, сохраняя достигнутый legacy-уровень.
 * @return { SkillMigrationResult } результат миграции
 */
export function migrateSkillXp(payload: Record<string, unknown>): SkillMigrationResult {
  const result: SkillMigrationResult = { success: true, migratedSkills: 0, errors: [] }

  try {
    const bucket: Record<string, unknown> | null = readSkillsBucket(payload)

    if (bucket !== null) {
      const migratedEntries: Record<string, { level: number, xp: number }> = {}

      for (const [skillKey, entry] of Object.entries(bucket)) {
        const legacyLevel: number | null = readLegacyLevel(entry)

        if (legacyLevel === null) {
          result.success = false
          result.errors.push(`${skillKey}: неизвестный формат записи навыка`)
          continue
        }

        const level: number = Math.max(0, Math.min(Math.round(legacyLevel), MAX_SKILL_LEVEL))
        migratedEntries[skillKey] = { level, xp: getXpForLevel(level) }
        result.migratedSkills += 1
      }

      if (!result.success) return result

      Object.assign(bucket, migratedEntries)
    }

    payload.skillSchemaVersion = SKILL_SCHEMA_VERSION
  } catch (error: unknown) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : String(error))
  }

  return result
}

/**
 * Проверяет, нужна ли миграция навыков.
 * @description [Infrastructure] - сравнивает версию схемы навыков в payload.
 * @return { boolean } true, если схема устарела
 */
export function needsSkillMigration(payload: Record<string, unknown>): boolean {
  const currentVersion: number = typeof payload.skillSchemaVersion === 'number' ? payload.skillSchemaVersion : 0

  return currentVersion < SKILL_SCHEMA_VERSION
}
