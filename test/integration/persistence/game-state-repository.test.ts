import { describe, expect, it } from 'vitest'
import { createPersistenceTestHarness } from '../../helpers/persistence-harness'
import { PostgresGameStateRepository } from '../../../apps/server/src/infrastructure/persistence/postgres-repositories'

describe.skipIf(process.env.RUN_PERSISTENCE_TESTS !== '1')('PostgreSQL game-state repository', () => {
  it('survives reload and enforces compare-and-swap version', async () => {
    const harness = createPersistenceTestHarness()
    const repository = new PostgresGameStateRepository<{ value: number }>(harness.pool)
    const now = new Date()
    await harness.reset()
    await repository.create({
      sessionId: 'session-repository-test',
      playerId: 'player-repository-test',
      state: { value: 1 },
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + 86_400_000),
    })

    const loaded = await repository.findByPlayerId('player-repository-test')
    const saved = await repository.saveIfVersionMatches('session-repository-test', 0, { value: 2 })

    expect(loaded?.state).toEqual({ value: 1 })
    expect(saved.state).toEqual({ value: 2 })
    expect(saved.stateVersion).toBe(1)
    await harness.close()
  })
})
