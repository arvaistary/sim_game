import { describe, expect, it } from 'vitest'
import type { CommandResultDto } from '@game-life/contracts'
import { GameStateService, CommandIdConflictError } from '@game-life/application'
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import { GameCommandExecutor } from '@/domain/game-command-executor'
import { hashCommandRequest } from '../../../apps/server/src/infrastructure/persistence/request-hash'
import { MemoryGameStateRepository, MemoryUnitOfWork } from '../../../apps/server/src/session-repository'

describe('GameStateService', () => {
  function createService(repository: MemoryGameStateRepository): GameStateService<GameWorldJSON, CommandResultDto> {
    return new GameStateService({
      unitOfWork: new MemoryUnitOfWork<CommandResultDto>(repository),
      executor: new GameCommandExecutor(),
      requestHash: hashCommandRequest,
    })
  }

  async function seed(repository: MemoryGameStateRepository): Promise<void> {
    const now = new Date()
    await repository.create({
      sessionId: 'session-1',
      playerId: 'player-1',
      state: GameWorld.createEmpty().toJSON(),
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
    })
  }

  it('applies command once and replays cached result', async () => {
    const repository = new MemoryGameStateRepository()
    await seed(repository)
    const service = createService(repository)
    const command = { commandId: 'cmd-1', type: 'action', payload: { actionId: 'self_morning_routine' } }

    const first = await service.execute('player-1', 'session-1', command)
    const retry = await service.execute('player-1', 'session-1', command)

    expect(first.replayed).toBe(false)
    expect(first.stateVersion).toBe(1)
    expect(retry.replayed).toBe(true)
    expect(retry.result).toEqual(first.result)
    expect((await repository.findByPlayerId('player-1'))?.stateVersion).toBe(1)
  })

  it('rejects same command id with different payload', async () => {
    const repository = new MemoryGameStateRepository()
    await seed(repository)
    const service = createService(repository)

    await service.execute('player-1', 'session-1', {
      commandId: 'cmd-1',
      type: 'action',
      payload: { actionId: 'self_morning_routine' },
    })

    await expect(service.execute('player-1', 'session-1', {
      commandId: 'cmd-1',
      type: 'action',
      payload: { actionId: 'self_public_speaking' },
    })).rejects.toBeInstanceOf(CommandIdConflictError)
  })
})
