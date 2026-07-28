import { describe, expect, it } from 'vitest'
import { GameStateService, StateVersionConflictError } from '@game-life/application'
import type { CommandResultDto } from '@game-life/contracts'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '../../../src/domain/game-world/GameWorld.types'
import { GameCommandExecutor } from '../../../src/domain/game-command-executor'
import { hashCommandRequest } from '../../../apps/server/src/infrastructure/persistence/request-hash'
import { MemoryGameStateRepository, MemoryUnitOfWork } from '../../../apps/server/src/session-repository'

describe('compare-and-swap concurrency boundary', () => {
  it('accepts one stale-version mutation and rejects the other', async () => {
    const repository = new MemoryGameStateRepository()
    const now = new Date()
    await repository.create({
      sessionId: 'concurrency-session',
      playerId: 'concurrency-player',
      state: GameWorld.createEmpty().toJSON(),
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
    })
    const createService = () => new GameStateService<GameWorldJSON, CommandResultDto>({
      unitOfWork: new MemoryUnitOfWork<CommandResultDto>(repository),
      executor: new GameCommandExecutor(),
      requestHash: hashCommandRequest,
    })
    const commands = [
      { commandId: 'concurrent-a', type: 'action', payload: { actionId: 'self_morning_routine' }, expectedStateVersion: 0 },
      { commandId: 'concurrent-b', type: 'action', payload: { actionId: 'self_morning_routine' }, expectedStateVersion: 0 },
    ]
    const results = await Promise.allSettled(commands.map((command) => createService().execute('concurrency-player', 'concurrency-session', command)))
    const fulfilled = results.filter((result) => result.status === 'fulfilled')
    const rejected = results.filter((result) => result.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(StateVersionConflictError)
    expect((await repository.findByPlayerId('concurrency-player'))?.stateVersion).toBe(1)
  })
})
