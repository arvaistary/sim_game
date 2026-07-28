import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { GameCommandExecutor } from '@/domain/game-command-executor'

describe('GameCommandExecutor', () => {
  const executor: GameCommandExecutor = new GameCommandExecutor()

  it.each([
    ['action', { actionId: 'missing' }],
    ['work', { hours: 8 }],
    ['event', { choiceId: 'missing', event: null }],
    ['career', { jobId: 'missing' }],
    ['finance', { actionId: 'missing' }],
  ] as const)('maps %s command to domain handler', (type, payload) => {
    const result = executor.execute(GameWorld.createEmpty().toJSON(), { type, payload })

    expect(result.result).toEqual(expect.objectContaining({ success: false }))
    expect(result.state.version).toBeDefined()
  })

  it('maps education command and returns updated snapshot', () => {
    const result = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'test-program' },
    })

    expect(result.result).toEqual(expect.objectContaining({ success: true }))
    expect((result.state.education as Record<string, unknown>).activeEducation).toEqual(
      expect.objectContaining({ id: 'test-program' }),
    )
  })

  it('returns validation result for invalid payload instead of mutating state', () => {
    const state = GameWorld.createEmpty().toJSON()
    const result = executor.execute(state, { type: 'work', payload: { hours: '8' } as unknown as Record<string, unknown> })

    expect(result.result.success).toBe(false)
    expect(result.state).toEqual(state)
  })

  it('supports career quit, finance settlement and education advance subcommands', () => {
    const started = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'test-program' },
    })
    const advanced = executor.execute(started.state, { type: 'education', payload: { operation: 'advance' } })
    const quit = executor.execute(GameWorld.createEmpty().toJSON(), { type: 'career', payload: { operation: 'quit' } })
    const settled = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'finance',
      payload: { action: 'monthly_settlement' },
    })

    expect(advanced.result.success).toBe(true)
    expect(quit.result.success).toBe(true)
    expect(settled.result.success).toBe(true)
  })
})
