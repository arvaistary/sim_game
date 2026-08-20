import type { PossessionId } from './possessions.types'

export type { PossessionId } from './possessions.types'

/** @description [Constants] - идентификаторы вещей персонажа (в будущем синхронизируются с инвентарём). */
export const POSSESSION_IDS = {
  computer: 'computer',
} as const satisfies Record<'computer', PossessionId>

/** @description [Constants] - подписи вещей для UI и сообщений о требованиях. */
export const POSSESSION_LABELS: Record<PossessionId, string> = {
  [POSSESSION_IDS.computer]: 'Компьютер',
}

/**
 * @description [Constants] - подпись вещи по id (неизвестные id возвращаются как есть).
 * @return { string }
 */
export function getPossessionLabel(possessionId: string): string {
  if (possessionId in POSSESSION_LABELS) {
    return POSSESSION_LABELS[possessionId as PossessionId]
  }

  return possessionId
}
