import type { SaveRepository } from '@/application/game/ports/SaveRepository'
import { DEFAULT_SAVE_KEY } from './constants'
import { migrateSave, needsMigration } from './event-migration'

/**
 * Создаёт репозиторий сохранений на основе localStorage
 * @param saveKey - Ключ для хранения данных в localStorage
 * @returns Объект, реализующий интерфейс SaveRepository
 */
export function createLocalStorageSaveRepository(
  saveKey: string = DEFAULT_SAVE_KEY
): SaveRepository {
  return {
    save(payload: Record<string, unknown>): void {
      localStorage.setItem(saveKey, JSON.stringify(payload))
    },

    load(): Record<string, unknown> | null {
      const raw = localStorage.getItem(saveKey)
      if (!raw) return null
      try {
        const payload = JSON.parse(raw) as Record<string, unknown>

        if (needsMigration(payload)) {
          const migrationResult = migrateSave(payload)
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
