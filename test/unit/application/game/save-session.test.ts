import { describe, it, expect } from 'vitest'
import {
  buildSaveSnapshot,
  persistSave,
  restoreSave,
  clearSave,
} from '@application/game'
import type { SaveRepository, GameSessionSnapshot } from '@application/game'

function createMockSnapshot(): GameSessionSnapshot {
  return {
    player: { name: 'Test', isInitialized: true },
    time: { totalHours: 100, sleepDebt: 0, startAge: 18 },
    stats: { energy: 80, health: 90, hunger: 30, stress: 10, mood: 70, physical: 50 },
    wallet: { money: 5000, reserveFund: 0, totalEarned: 10000, totalSpent: 5000 },
    skills: { programming: 3 },
    career: { currentJob: null },
    education: { educationLevel: 'Среднее' },
    housing: { level: 1, comfort: 50 },
    events: {},
    finance: {},
    activity: {},
  }
}

function createMockRepository(stored: Record<string, unknown> | null = null): SaveRepository {
  let saved: Record<string, unknown> | null = stored

  return {
    async save(payload: Record<string, unknown>): Promise<void> {
      saved = payload
    },

    async load(): Promise<Record<string, unknown> | null> {
      return saved
    },

    async clear(): Promise<void> {
      saved = null
    },
  }
}

describe('buildSaveSnapshot', () => {
  it('возвращает VersionedSavePayload с version = 1', () => {
    const snapshot = createMockSnapshot()
    const result = buildSaveSnapshot(snapshot)

    expect(result.success).toBe(true)
    expect(result.payload).toBeDefined()
    expect(result.payload!.version).toBe(1)
    expect(result.payload!.data).toEqual(snapshot)
    expect(typeof result.payload!.timestamp).toBe('number')
  })

  it('payload.data содержит все slice keys', () => {
    const snapshot = createMockSnapshot()
    const result = buildSaveSnapshot(snapshot)

    const data = result.payload!.data
    expect(data).toHaveProperty('player')
    expect(data).toHaveProperty('time')
    expect(data).toHaveProperty('stats')
    expect(data).toHaveProperty('wallet')
    expect(data).toHaveProperty('skills')
    expect(data).toHaveProperty('career')
    expect(data).toHaveProperty('education')
    expect(data).toHaveProperty('housing')
    expect(data).toHaveProperty('events')
    expect(data).toHaveProperty('finance')
    expect(data).toHaveProperty('activity')
  })
})

describe('persistSave', () => {
  it('сохраняет versioned payload через repository', async () => {
    const snapshot = createMockSnapshot()
    const repository = createMockRepository()
    const result = await persistSave(repository, snapshot)

    expect(result.success).toBe(true)
    expect(result.payload).toBeDefined()
    expect(result.payload!.version).toBe(1)
  })

  it('вызывает repository.save с versioned payload', async () => {
    const snapshot = createMockSnapshot()
    let savedPayload: Record<string, unknown> | null = null

    const repository: SaveRepository = {
      async save(payload: Record<string, unknown>): Promise<void> { savedPayload = payload },
      async load(): Promise<Record<string, unknown> | null> { return savedPayload },
      async clear(): Promise<void> { savedPayload = null },
    }

    await persistSave(repository, snapshot)

    expect(savedPayload).toBeDefined()
    expect((savedPayload as unknown as Record<string, unknown>).version).toBe(1)
    expect(typeof (savedPayload as unknown as Record<string, unknown>).timestamp).toBe('number')
  })
})

describe('restoreSave', () => {
  it('возвращает isNewGame: true когда repository пуст', async () => {
    const repository = createMockRepository(null)
    const result = await restoreSave(repository)

    expect(result.success).toBe(true)
    expect(result.isNewGame).toBe(true)
    expect(result.data).toBeUndefined()
  })

  it('восстанавливает versioned payload', async () => {
    const snapshot = createMockSnapshot()
    const versionedPayload = {
      version: 1,
      timestamp: Date.now(),
      data: snapshot,
    }

    const repository = createMockRepository(versionedPayload as unknown as Record<string, unknown>)
    const result = await restoreSave(repository)

    expect(result.success).toBe(true)
    expect(result.isNewGame).toBe(false)
    expect(result.data).toEqual(snapshot)
  })

  it('восстанавливает legacy (non-versioned) payload', async () => {
    const legacyData = {
      player: { name: 'LegacyPlayer' },
      time: { totalHours: 50 },
      stats: { energy: 60 },
      wallet: { money: 1000 },
    }

    const repository = createMockRepository(legacyData as unknown as Record<string, unknown>)
    const result = await restoreSave(repository)

    expect(result.success).toBe(true)
    expect(result.isNewGame).toBe(false)
    expect(result.data).toBeDefined()
    expect(result.data!.player).toEqual({ name: 'LegacyPlayer' })
  })

  it('возвращает isNewGame: true для невалидного payload', async () => {
    const invalidData = { foo: 'bar' }
    const repository = createMockRepository(invalidData as unknown as Record<string, unknown>)
    const result = await restoreSave(repository)

    expect(result.success).toBe(true)
    expect(result.isNewGame).toBe(true)
  })
})

describe('clearSave', () => {
  it('вызывает repository.clear', async () => {
    let cleared = false
    const repository: SaveRepository = {
      async save(): Promise<void> {},
      async load(): Promise<null> { return null },
      async clear(): Promise<void> { cleared = true },
    }

    await clearSave(repository)

    expect(cleared).toBe(true)
  })
})
