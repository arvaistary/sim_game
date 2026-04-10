import type { SaveRepository } from '@/application/game/ports/SaveRepository'
import { DEFAULT_SAVE_KEY } from './constants'

export class LocalStorageSaveRepository implements SaveRepository {
  constructor(private readonly saveKey: string = DEFAULT_SAVE_KEY) {}

  save(payload: Record<string, unknown>): void {
    localStorage.setItem(this.saveKey, JSON.stringify(payload))
  }

  load(): Record<string, unknown> | null {
    const raw = localStorage.getItem(this.saveKey)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return null
    }
  }

  clear(): void {
    localStorage.removeItem(this.saveKey)
  }
}
