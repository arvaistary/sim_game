import type { SaveRepository } from '@/application/game/ports/SaveRepository.types'
import { DEFAULT_SAVE_KEY } from './constants'
import type { MigrationResult } from './event-migration'
import { migrateSave, needsMigration } from './event-migration'

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

        if (needsMigration(payload)) {
          const migrationResult: MigrationResult = migrateSave(payload)

          if (!migrationResult.success) {
            console.warn('[save] migration completed with errors:', migrationResult.errors)
          }
        }

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
