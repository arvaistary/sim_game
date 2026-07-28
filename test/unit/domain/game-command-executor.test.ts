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

  it('keeps catalog steps and completes meditation book after all study hours', () => {
    const started = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    })
    const active = (started.state.education as Record<string, unknown>).activeEducation as Record<string, unknown>

    expect(active).toEqual(expect.objectContaining({
      id: 'meditation_foundations_book',
      name: 'Книга «Основы медитации»',
      hoursTotal: 14,
      currentStepIndex: 0,
    }))
    expect(active.steps).toHaveLength(5)

    let state = started.state
    for (let hour = 0; hour < 14; hour += 1) {
      state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state
    }

    const education = state.education as Record<string, unknown>
    expect(education.activeEducation).toBeNull()
    expect(education.completedPrograms).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'meditation_foundations_book', name: 'Книга «Основы медитации»' }),
    ]))
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { level: number }>).meditation.level).toBe(0)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { xp: number }>).meditation.xp).toBe(50)
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
