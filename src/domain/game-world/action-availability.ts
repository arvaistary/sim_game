import type { BalanceAction } from '@/domain/balance/actions/types'

import type { GameWorld } from './GameWorld'

/**
 * Проверить, выдан ли игроку предмет из действия магазина.
 * @description [Domain] - читает инвентарь housing.furniture.
 * @return { boolean } true, если предмет уже куплен
 */
export function hasGrantedItem(world: GameWorld, itemId: string): boolean {
  if (!itemId) return false

  const furniture: Array<{ id?: string; purchased?: boolean }> = world.housing.furniture as Array<{ id?: string; purchased?: boolean }>

  return furniture.some((item: { id?: string; purchased?: boolean }) => item.id === itemId && item.purchased === true)
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

  const usage: { count: number } | undefined = world.actionUsage[actionId]

  if (usage && usage.count > 0) {
    return 'Действие уже выполнено'
  }

  return null
}
