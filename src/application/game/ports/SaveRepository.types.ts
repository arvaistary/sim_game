export interface SaveRepository {
  save(payload: Record<string, unknown>): Promise<void>
  load(): Promise<Record<string, unknown> | null>
  clear(): Promise<void>
}

export interface GameSessionSnapshot {
  player: Record<string, unknown>
  time: Record<string, unknown>
  stats: Record<string, unknown>
  wallet: Record<string, unknown>
  skills: Record<string, unknown>
  career: Record<string, unknown>
  education: Record<string, unknown>
  housing: Record<string, unknown>
  events: Record<string, unknown>
  finance: Record<string, unknown>
  activity: Record<string, unknown>
}

export const CURRENT_SAVE_VERSION = 1

export interface VersionedSavePayload {
  version: number
  timestamp: number
  data: GameSessionSnapshot
}

export function createSavePayload(data: GameSessionSnapshot): VersionedSavePayload {
  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: Date.now(),
    data,
  }
}

export function isVersionedPayload(raw: unknown): raw is VersionedSavePayload {
  if (!raw || typeof raw !== 'object') return false

  const payload= raw as Record<string, unknown>

  return typeof payload.version === 'number' && typeof payload.data === 'object'
}

export function extractSaveData(raw: unknown): GameSessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null

  if (isVersionedPayload(raw)) {
    return raw.data
  }

  const legacy= raw as Record<string, unknown>
  const hasPlayer= typeof legacy.player === 'object'
  const hasTime= typeof legacy.time === 'object'

  if (hasPlayer && hasTime) {
    return legacy as unknown as GameSessionSnapshot
  }

  return null
}
