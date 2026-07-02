/**
 * Unit-тесты для executor-factory (server-first migration, Stage 2-3).
 *
 * Factory — чистая функция от game-mode. SPA режим возвращает working executor,
 * server mode — stub с reject. Не требует Nuxt env.
 */
import { describe, it, expect } from 'vitest'
import type { AsyncGameExecutor, AsyncGameQueryExecutor } from '@/application/game/async-executor.types'
import {
  createExecutor,
  createQueryExecutor,
  createSPAExecutorAsync,
} from '@/application/game/executor-factory'

describe('executor-factory', () => {
  it('createExecutor(spa) возвращает SPA executor (не бросает на construction', () => {
    const executor: AsyncGameExecutor = createExecutor('spa')
    expect(executor).toBeDefined()
    expect(typeof executor.executeAction).toBe('function')
  })

  it('createExecutor(hybrid) fallback на SPA', () => {
    const executor: AsyncGameExecutor = createExecutor('hybrid')
    expect(executor).toBeDefined()
    expect(typeof executor.simulateWorkShift).toBe('function')
  })

  it('createExecutor(server) возвращает executor, пытающийся вызвать API', async () => {
    const executor: AsyncGameExecutor = createExecutor('server')
    // В unit-окружении $fetch не определён — ожидаем rejection
    // (не "not implemented", а network/fetch ошибку)
    await expect(executor.executeAction(null, 'test')).rejects.toBeDefined()
  })

  it('createQueryExecutor(spa) возвращает SPA query executor', () => {
    const query: AsyncGameQueryExecutor = createQueryExecutor('spa')
    expect(query).toBeDefined()
    expect(typeof query.getFinanceOverview).toBe('function')
  })

  it('createQueryExecutor(server) возвращает executor, пытающийся вызвать API', async () => {
    const query: AsyncGameQueryExecutor = createQueryExecutor('server')
    // В unit-окружении $fetch не определён — ожидаем rejection
    await expect(query.getFinanceOverview(null)).rejects.toBeDefined()
  })

  it('createSPAExecutorAsync возвращает тот же тип, что createExecutor(spa)', () => {
    const explicit: AsyncGameExecutor = createSPAExecutorAsync()
    const viaFactory: AsyncGameExecutor = createExecutor('spa')
    expect(typeof explicit.executeAction).toBe(typeof viaFactory.executeAction)
    expect(typeof explicit.simulateWorkShift).toBe(typeof viaFactory.simulateWorkShift)
  })

  it('SPA executor rejects без world', async () => {
    const executor: AsyncGameExecutor = createExecutor('spa')
    await expect(executor.executeAction(null, 'test')).rejects.toThrow(
      /world required for SPA/i,
    )
  })
})
