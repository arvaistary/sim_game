import type { BalanceAction } from '@/domain/balance/actions/types'

import type { GameWorld } from './GameWorld'
import type { GrantedFurniture } from './action-availability.types'
import type { ActionUsageEntry } from './GameWorld.types'

/**
 * Проверить, выдан ли игроку предмет из действия магазина.
 * @description [Domain] - читает инвентарь housing.furniture.
 * @return { boolean } true, если предмет уже куплен
 */
export function hasGrantedItem(world: GameWorld, itemId: string): boolean {
  if (!itemId) return false

  const furniture: GrantedFurniture[] = world.housing.furniture as GrantedFurniture[]

  return furniture.some((item: GrantedFurniture) => item.id === itemId && item.purchased === true)
}

/**
 * Причина недоступности oneTime-действия (null — можно выполнять).
 * @description [Domain] - проверяет grantsItem и actionUsage до списания денег.
 * @return { string | null } текст блокировки или null
 */
export function getActionAvailabilityBlockReason(world: GameWorld, action: BalanceAction, actionId: string): string | null {
  if (!action.oneTime) return null

  if (action.grantsItem && hasGrantedItem(world, action.grantsItem)) {
    return 'Уже куплено'
  }

  const usage: ActionUsageEntry | undefined = world.actionUsage[actionId]

  if (usage && usage.count > 0) {
    return 'Действие уже выполнено'
  }

  return null
}
