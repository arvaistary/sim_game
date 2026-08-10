import { describe, it, expect } from 'vitest'

import { getActionById } from '@/domain/balance/actions'
import { canExecuteAction } from '@/application/game/queries'
import { executeActionCommand } from '@/domain/game-world/commands/execute-action'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { getActionAvailabilityBlockReason } from '@/domain/game-world/action-availability'

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
    const action = getActionById('shop_meditation_foundations_book')

    expect(action).not.toBeNull()

    const blockReason: string | null = getActionAvailabilityBlockReason(ownedWorld, action!, 'shop_meditation_foundations_book')

    expect(blockReason).toBe('Уже куплено')

    const query = canExecuteAction(ownedWorld, 'shop_meditation_foundations_book')

    expect(query.canExecute).toBe(false)
    expect(query.reason).toBe('Уже куплено')

    const result = executeActionCommand(ownedWorld, 'shop_meditation_foundations_book')

    expect(result.success).toBe(false)
    expect(result.message).toBe('Уже куплено')
    expect(ownedWorld.wallet.money).toBe(5000)
  })

  it('allows first purchase of oneTime shop book', () => {
    const freshWorld: GameWorld = GameWorld.createEmpty({
      wallet: { money: 5000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    })
    const query = canExecuteAction(freshWorld, 'shop_meditation_foundations_book')

    expect(query.canExecute).toBe(true)

    const result = executeActionCommand(freshWorld, 'shop_meditation_foundations_book')

    expect(result.success).toBe(true)
    expect(freshWorld.wallet.money).toBe(5000 - 690)
    expect(freshWorld.housing.furniture.some(item => item.id === 'book_meditation_foundations' && item.purchased === true)).toBe(true)
  })
})
