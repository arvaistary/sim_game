import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { createLiveDayEndHooks, planDayCommand } from '@/domain/game-world/commands'
import type { DayPlanResult } from '@/domain/game-world/commands'
import { createFakeRandomSource } from './__fixtures__/fake-random-source'

describe('life lifecycle integration', () => {
  it('ends the game when an existing zero health state is confirmed', () => {
    const world: GameWorld = GameWorld.createEmpty({ stats: { hunger: 70, energy: 70, stress: 30, mood: 60, health: 0, physical: 50 } })

    const result: DayPlanResult = planDayCommand(world, { sleepHours: 7, actionIds: [] })

    expect(result.success).toBe(false)
    expect(result.message).toBe('Нельзя прожить период: здоровье достигло нуля')
    expect(world.life.status).toBe('ended')
    expect(world.life.deathCause).toBe('illness')
    expect(world.life.summary?.deathCause).toBe('illness')
    expect(world.meta.livesCompleted).toBe(1)
    expect(world.meta.deathCauseCounts.illness).toBe(1)
  })

  it('serializes and restores the final summary', () => {
    const world: GameWorld = GameWorld.createEmpty({ stats: { hunger: 70, energy: 70, stress: 30, mood: 60, health: 0, physical: 50 } })
    planDayCommand(world, { sleepHours: 7, actionIds: [] })

    const restored: GameWorld = GameWorld.fromJSON(world.toJSON())

    expect(restored.life).toEqual(world.life)
  })

  it('can trigger an accident from the live yearly hook', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.time.totalHours = 364 * 24
    world.player.currentAge = 18

    const result: DayPlanResult = planDayCommand(
      world,
      { sleepHours: 0, actionIds: [] },
      createLiveDayEndHooks(createFakeRandomSource([0])),
    )

    expect(result.success).toBe(false)
    expect(result.message).toBe('Игра завершена')
    expect(world.life.status).toBe('ended')
    expect(world.life.deathCause).toBe('accident')
    expect(world.meta.livesCompleted).toBe(1)
    expect(world.meta.deathCauseCounts.accident).toBe(1)
  })
})
