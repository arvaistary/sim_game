import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { GameWorld } from '@/domain/game-world/GameWorld'

export interface GameFacade {
  readonly world: GameWorld

  toJSON(): GameWorldJSON
  toSnapshot(): GameWorldSnapshot
}
