import type { PossessionId } from '@/constants/possessions'

/**
 * @description [Infrastructure] - мост инвентарь → playerState.possessions (заглушка до системы инвентаря).
 * @return { PossessionId[] }
 */
export function mapInventoryItemsToPossessions(itemIds: readonly string[]): PossessionId[] {
  const known: Set<string> = new Set(['computer'])

  return itemIds.filter((itemId: string): itemId is PossessionId => known.has(itemId))
}

/**
 * @description [Infrastructure] - применить вещи из инвентаря к playerState.
 * @return { void }
 */
export function applyInventoryPossessionsToPlayerState(
  setPossessions: (possessionIds: PossessionId[]) => void,
  inventoryItemIds: readonly string[],
): void {
  setPossessions(mapInventoryItemsToPossessions(inventoryItemIds))
}
