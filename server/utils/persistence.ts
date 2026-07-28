import type { GameStateRecord, GameStateRepository, GameCommandRequest  } from '@game-life/application'
import type { CommandResultDto } from '@game-life/contracts'
import { GameStateService } from '@game-life/application'
import { GameCommandExecutor } from '@/domain/game-command-executor'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import { getPool } from '../../apps/server/src/infrastructure/persistence/db'
import {
  PostgresGameStateRepository,
  PostgresUnitOfWork,
} from '../../apps/server/src/infrastructure/persistence/postgres-repositories'
import { hashCommandRequest } from '../../apps/server/src/infrastructure/persistence/request-hash'


let repository: GameStateRepository<GameWorldJSON> | undefined
let service: GameStateService<GameWorldJSON, CommandResultDto> | undefined

export function getPersistenceRepository(): GameStateRepository<GameWorldJSON> {
  repository ??= new PostgresGameStateRepository<GameWorldJSON>(getPool())
  return repository
}

export function getGameStateService(): GameStateService<GameWorldJSON, CommandResultDto> {
  service ??= new GameStateService<GameWorldJSON, CommandResultDto>({
    unitOfWork: new PostgresUnitOfWork<GameWorldJSON, CommandResultDto>(getPool()),
    executor: new GameCommandExecutor(),
    requestHash: hashCommandRequest,
  })
  return service
}

export async function initializePersistentSession(
  sessionId: string,
  state: GameWorldJSON,
): Promise<GameStateRecord<GameWorldJSON>> {
  const stateRepository: GameStateRepository<GameWorldJSON> = getPersistenceRepository()
  const existing: GameStateRecord<GameWorldJSON> | null = await stateRepository.findByPlayerId(sessionId)
  if (existing) return existing
  const now = new Date()
  const record: GameStateRecord<GameWorldJSON> = {
    sessionId,
    playerId: sessionId,
    state,
    schemaVersion: 1,
    stateVersion: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + 86_400_000),
  }
  await stateRepository.create(record)
  return record
}

export type { GameCommandRequest }
