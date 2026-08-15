import { describe, it, expect } from 'vitest'

import { getActionById } from '@/domain/balance/actions'
import { canExecuteAction } from '@/application/game/queries'
import { executeActionCommand } from '@/domain/game-world/commands/execute-action'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { getActionAvailabilityBlockReason } from '@/domain/game-world/action-availability'
import type { BalanceAction } from '@/domain/balance/actions/types'
import type { ExecuteActionResult } from '@/domain/game-world/commands/commands.types'
import type { CanExecuteActionResult } from '@/stores/game.store.types'

describe('action availability (oneTime)', () => {
  it('blocks repeat purchase when grantsItem already owned', () => {
    const ownedWorld: GameWorld = GameWorld.createEmpty({
      wallet: { money: 5000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
      housing: {
        level: 0,
        comfort: 20,
        furniture: [{ id: 'book_meditation_foundations', name: 'book', comfortBonus: 0, purchased: true }],
        lastWeeklyBonus: null,
      },
    })
    const action: BalanceAction | null = getActionById('shop_meditation_foundations_book')

    expect(action).not.toBeNull()

    const blockReason: string | null = getActionAvailabilityBlockReason(ownedWorld, action!, 'shop_meditation_foundations_book')

    expect(blockReason).toBe('Уже куплено')

    const query: CanExecuteActionResult = canExecuteAction(ownedWorld, 'shop_meditation_foundations_book')

    expect(query.canExecute).toBe(false)
    expect(query.reason).toBe('Уже куплено')

    const result: ExecuteActionResult = executeActionCommand(ownedWorld, 'shop_meditation_foundations_book')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Уже куплено')
    expect(ownedWorld.wallet.money).toBe(5000)
  })

  it('allows first purchase of oneTime shop book', () => {
    const freshWorld: GameWorld = GameWorld.createEmpty({
      wallet: { money: 5000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    })
    const query: CanExecuteActionResult = canExecuteAction(freshWorld, 'shop_meditation_foundations_book')

    expect(query.canExecute).toBe(true)

    const result: ExecuteActionResult = executeActionCommand(freshWorld, 'shop_meditation_foundations_book')

    expect(result.success).toBe(true)
    expect(freshWorld.wallet.money).toBe(5000 - 690)
    expect(freshWorld.housing.furniture.some(item => item.id === 'book_meditation_foundations' && item.purchased === true)).toBe(true)
  })
})

describe('action availability (daily budget)', () => {
  it('blocks an action that does not fit the remaining day', () => {
    const world: GameWorld = GameWorld.createEmpty({
      wallet: { money: 5000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    })
    world.time.dayHoursRemaining = 2

    const result: ExecuteActionResult = executeActionCommand(world, 'fun_cinema')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Недостаточно времени на сегодня')
    expect(world.time.totalHours).toBe(0)
  })
})
