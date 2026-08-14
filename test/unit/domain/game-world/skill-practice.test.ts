import { describe, expect, it } from 'vitest'

import { getLevelFromXp } from '@/domain/balance/skills'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { executeActionCommand } from '@/domain/game-world/commands/execute-action'
import type { SkillLevels } from '@/domain/game-world/GameWorld.types'
import type { ExecuteActionResult } from '@/domain/game-world/commands/commands.types'

function readSkillXp(world: GameWorld, key: string): number {
  const entry: SkillLevels[string] | undefined = world.skills.levels[key]

  if (entry === undefined) return 0

  return typeof entry === 'number' ? 0 : (entry.xp ?? 0)
}

describe('skill practice through actions', () => {
  it('grants experience proportional to hours instead of whole levels', () => {
    const world: GameWorld = GameWorld.createEmpty({
      wallet: { money: 50000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    })

    const result: ExecuteActionResult = executeActionCommand(world, 'home_cook_dinner')

    expect(result.success).toBe(true)

    const gainedXp: number = readSkillXp(world, 'cooking')

    expect(gainedXp).toBeGreaterThan(0)
    expect(gainedXp).toBeLessThan(50)
    expect(getLevelFromXp(gainedXp)).toBe(0)
  })

  it('needs many repetitions to reach the first level', () => {
    const world: GameWorld = GameWorld.createEmpty({
      wallet: { money: 500000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    })

    for (let repetition: number = 0; repetition < 20; repetition += 1) {
      executeActionCommand(world, 'home_cook_dinner')
    }

    expect(readSkillXp(world, 'cooking')).toBeGreaterThanOrEqual(50)
  })
})
