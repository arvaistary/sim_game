import type {
  GameStateRecord,
  GameStateRepository,
  GameStateService,
  UnitOfWork,
} from '@game-life/application'
import type { CommandResultDto, InitRequestBody  } from '@game-life/contracts'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'


export interface PersistenceReadiness {
  status: 'ready' | 'not_ready'
  schemaVersion: number
  appliedMigrations: number
  pendingMigrations: number
  database: 'reachable' | 'unreachable'
  reason?: string
}

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
  service?: GameStateService<GameWorldJSON, CommandResultDto>
  unitOfWork?: UnitOfWork<GameWorldJSON, CommandResultDto>
  corsOrigins?: string[]
  readiness?: () => Promise<PersistenceReadiness>
}

export interface LoadedWorld {
  record: GameStateRecord<GameWorldJSON>
  world: GameWorld
}
