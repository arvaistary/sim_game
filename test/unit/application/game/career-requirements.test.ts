import { describe, expect, it } from 'vitest'
import { changeCareer } from '@/application/game/commands'
import { GameWorld } from '@/domain/game-world/GameWorld'

describe('application career requirements', () => {
  it('enforces age and education in the SPA command path', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.player.currentAge = 18
    world.skills.levels.professionalism = { level: 10, xp: 0 }

    expect(changeCareer(world, 'it_middle')).toEqual({
      success: false,
      message: 'Требуется возраст 22+',
    })

    world.player.currentAge = 22
    expect(changeCareer(world, 'it_middle')).toEqual({
      success: false,
      message: 'Требуется образование: Среднее',
    })

    world.education.educationLevel = 'school'
    expect(changeCareer(world, 'it_middle').success).toBe(true)
  })
})
