import type { GameSessionSnapshot } from './index.types'
import type { SaveResult, LoadResult } from './index.types'
import type { SaveRepository } from './ports/SaveRepository.types'

/**
 * @description [Application/Game] - создаёт версионированный снимок сохранения
 * @return { SaveResult } результат создания снимка
 */
export function buildSaveSnapshot(slices: GameSessionSnapshot): SaveResult {
  return {
    success: true,
    payload: {
      version: 1,
      timestamp: Date.now(),
      data: slices,
    },
  }
}

/**
 * @description [Application/Game] - сохраняет игру через репозиторий
 * @return { Promise<SaveResult> } результат сохранения
 */
export async function persistSave(
  repository: SaveRepository,
  snapshot: GameSessionSnapshot,
): Promise<SaveResult> {
  const result: SaveResult = buildSaveSnapshot(snapshot)

  await repository.save(result.payload as unknown as Record<string, unknown>)

  return result
}

/**
 * @description [Application/Game] - восстанавливает сохранение из репозитория
 * @return { Promise<LoadResult> } результат восстановления
 */
export async function restoreSave(repository: SaveRepository): Promise<LoadResult> {
  const raw: Record<string, unknown> | null = await repository.load()

  if (!raw) {
    return { success: true, isNewGame: true }
  }

  if (isVersionedPayload(raw)) {
    return { success: true, data: raw.data, isNewGame: false }
  }

  const legacy: Record<string, unknown> = raw as Record<string, unknown>
  const hasPlayer= typeof legacy.player === 'object'
  const hasTime= typeof legacy.time === 'object'

  if (hasPlayer && hasTime) {
    return { success: true, data: legacy as unknown as GameSessionSnapshot, isNewGame: false }
  }

  return { success: true, isNewGame: true }
}

/**
 * @description [Application/Game] - очищает сохранение через репозиторий
 * @return { Promise<void> }
 */
export async function clearSave(repository: SaveRepository): Promise<void> {
  await repository.clear()
}

function isVersionedPayload(raw: Record<string, unknown>): raw is { version: number; data: GameSessionSnapshot } {
  return typeof raw.version === 'number' && typeof raw.data === 'object' && raw.data !== null
}
