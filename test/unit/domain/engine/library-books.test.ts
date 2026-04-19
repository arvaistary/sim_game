import { describe, expect, test } from 'vitest'
import { createWorldFromSave } from '@/domain/game-facade'
import { gameCommands } from '@/domain/game-facade/commands'
import { FURNITURE_COMPONENT, HOUSING_COMPONENT, PLAYER_ENTITY } from '@/domain/engine/components'

describe('library books persistence contract', () => {
  test('buying a book stores it in furniture and housing furniture', () => {
    const world = createWorldFromSave({ playerName: 'Reader' })

    gameCommands.executeAction(world, 'shop_time_management_book')

    const furniture = world.getComponent<Array<Record<string, unknown>>>(PLAYER_ENTITY, FURNITURE_COMPONENT)
    const housing = world.getComponent<Record<string, unknown>>(PLAYER_ENTITY, HOUSING_COMPONENT)
    const housingFurniture = (housing?.furniture ?? []) as Array<Record<string, unknown>>

    expect(furniture?.some(item => item.id === 'book_time_management')).toBe(true)
    expect(housingFurniture.some(item => item.id === 'book_time_management')).toBe(true)
  })
})
