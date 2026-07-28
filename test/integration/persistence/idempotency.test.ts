import { describe, expect, it } from 'vitest'
import { CommandIdConflictError, GameStateService } from '@game-life/application'
import type { CommandResultDto } from '@game-life/contracts'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '../../../src/domain/game-world/GameWorld.types'
import { GameCommandExecutor } from '../../../src/domain/game-command-executor'
import { hashCommandRequest } from '../../../apps/server/src/infrastructure/persistence/request-hash'
import { MemoryGameStateRepository, MemoryUnitOfWork } from '../../../apps/server/src/session-repository'

describe('command idempotency integration boundary', () => {
  it('returns cached result without a second state transition', async () => {
    const repository = new MemoryGameStateRepository()
    const now = new Date()
    await repository.create({
      sessionId: 'idempotency-session',
      playerId: 'idempotency-player',
      state: GameWorld.createEmpty().toJSON(),
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
    })
    const service = new GameStateService<GameWorldJSON, CommandResultDto>({
      unitOfWork: new MemoryUnitOfWork<CommandResultDto>(repository),
      executor: new GameCommandExecutor(),
      requestHash: hashCommandRequest,
    })
    const command = { commandId: 'idempotent-command', type: 'action', payload: { actionId: 'self_morning_routine' } }

    const first = await service.execute('idempotency-player', 'idempotency-session', command)
    const retry = await service.execute('idempotency-player', 'idempotency-session', command)

    expect(first.stateVersion).toBe(1)
    expect(retry.replayed).toBe(true)
    expect(retry.result).toEqual(first.result)
    await expect(service.execute('idempotency-player', 'idempotency-session', {
      ...command,
      payload: { actionId: 'self_public_speaking' },
    })).rejects.toBeInstanceOf(CommandIdConflictError)
  })
})
