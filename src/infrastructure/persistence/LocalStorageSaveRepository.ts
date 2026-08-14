import type { SaveRepository } from '@/application/game/ports/SaveRepository.types'
import { DEFAULT_SAVE_KEY } from './constants'
import type { MigrationResult } from './save-event-migration'
import { migrateSave, needsMigration } from './save-event-migration'
import type { SkillMigrationResult } from './save-skill-migration'
import { migrateSkillXp, needsSkillMigration } from './save-skill-migration'

/**
 * @description [Infrastructure] - создаёт репозиторий сохранений на основе localStorage.
 * @return { SaveRepository } адаптер чтения и записи save payload.
 */
export function createLocalStorageSaveRepository(
  saveKey: string = DEFAULT_SAVE_KEY
): SaveRepository {
  return {
    save(payload: Record<string, unknown>): void {
      localStorage.setItem(saveKey, JSON.stringify(payload))
    },

    load(): Record<string, unknown> | null {
      const raw: string | null = localStorage.getItem(saveKey)

      if (!raw) return null

      try {
        const payload: Record<string, unknown> = JSON.parse(raw) as Record<string, unknown>

        let shouldPersist: boolean = false

        if (needsMigration(payload)) {
          const migrationResult: MigrationResult = migrateSave(payload)
          shouldPersist = true

          if (!migrationResult.success) {
            console.warn('[save] migration completed with errors:', migrationResult.errors)
          } else {
            shouldPersist = true
          }
        }

        if (needsSkillMigration(payload)) {
          const skillMigration: SkillMigrationResult = migrateSkillXp(payload)
          shouldPersist = skillMigration.success && skillMigration.errors.length === 0

          if (!skillMigration.success || skillMigration.errors.length > 0) {
            console.warn('[save] skill migration completed with errors:', skillMigration.errors)
          }
        }

        if (shouldPersist) localStorage.setItem(saveKey, JSON.stringify(payload))

        return payload
      } catch {
        return null
      }
    },

    clear(): void {
      localStorage.removeItem(saveKey)
    },
  }
}
