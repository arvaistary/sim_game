import type { SaveRepository } from '@application/game/ports/SaveRepository.types'
import { DEFAULT_SAVE_KEY } from './constants'

export function createLocalStorageSaveRepository(
  saveKey: string = DEFAULT_SAVE_KEY
): SaveRepository {
  return {
    async save(payload: Record<string, unknown>): Promise<void> {
      localStorage.setItem(saveKey, JSON.stringify(payload))
    },

    async load(): Promise<Record<string, unknown> | null> {
      const raw = localStorage.getItem(saveKey)

      if (!raw) return null

      try {
        return JSON.parse(raw) as Record<string, unknown>
      } catch {
        return null
      }
    },

    async clear(): Promise<void> {
      localStorage.removeItem(saveKey)
    },
  }
}
