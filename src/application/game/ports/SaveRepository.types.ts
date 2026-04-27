export interface SaveRepository {
  save(payload: Record<string, unknown>): void
  load(): Record<string, unknown> | null
  clear(): void
}