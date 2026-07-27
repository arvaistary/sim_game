import type { GameStateRecord, GameStateRepository } from '@game-life/application'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { InitRequestBody } from '@game-life/contracts'

export type InitBody = InitRequestBody<GameWorldJSON>

export interface ActivityQuery {
  filter?: string
  limit?: string
  count?: string
}

export interface StandaloneApiErrorOptions {
  statusCode: number
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface StandaloneServerOptions {
  repository?: GameStateRepository<GameWorldJSON>
  corsOrigins?: string[]
}

export interface LoadedWorld {
  record: GameStateRecord<GameWorldJSON>
  world: GameWorld
}
