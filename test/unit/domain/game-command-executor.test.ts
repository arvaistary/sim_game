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
    expect(active.steps).toHaveLength(14)
    expect((active.steps as Array<Record<string, unknown>>)[0]?.content).toContain('Определите, зачем вам нужна практика')

    let state = executor.execute(started.state, { type: 'education', payload: { action: 'advance' } }).state
    const activeAfterFirstChapter = (state.education as Record<string, unknown>).activeEducation as Record<string, unknown>
    expect(activeAfterFirstChapter.currentStepIndex).toBe(1)
    expect((activeAfterFirstChapter.steps as Array<Record<string, unknown>>)[0]?.progressPercent).toBe(1)

    for (let hour = 1; hour < 14; hour += 1) {
      state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state
      if (hour === 7) {
        state = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } }).state
      }
    }

    const education = state.education as Record<string, unknown>
    expect(education.activeEducation).toBeNull()
    expect(education.completedPrograms).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'meditation_foundations_book', name: 'Книга «Основы медитации»' }),
    ]))
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { level: number }>).meditation.level).toBe(1)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { xp: number }>).meditation.xp).toBe(100)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { level: number }>).emotionalIntelligence.level).toBe(0.5)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { xp: number }>).emotionalIntelligence.xp).toBe(50)
  })

  it('tracks study hours until sleep and resets them after a sleep action', () => {
    let state = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state

    for (let hour = 0; hour < 8; hour += 1) {
      state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state
    }

    const blocked = executor.execute(state, { type: 'education', payload: { action: 'advance' } })
    expect((state.education as Record<string, unknown>).studyHoursSinceLastSleep).toBe(8)
    expect(blocked.result).toEqual({ success: false, message: 'Лимит учёбы исчерпан. Поспите для восстановления.' })

    const slept = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } })
    expect(slept.result.success).toBe(true)
    expect((slept.state.education as Record<string, unknown>).studyHoursSinceLastSleep).toBe(0)
    expect((slept.state.education as Record<string, unknown>).cognitiveLoad).toBe(0)
  })

  it('blocks education when cognitive load reaches its cap even if wake-cycle data is stale', () => {
    const started = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state
    const education = started.education as Record<string, unknown>
    education.cognitiveLoad = 80
    education.studyHoursSinceLastSleep = 0

    const blocked = executor.execute(started, { type: 'education', payload: { action: 'advance' } })

    expect(blocked.result).toEqual({
      success: false,
      message: 'Когнитивная нагрузка слишком высока. Поспите для восстановления.',
    })
  })

  it('upgrades an in-progress legacy book to one-hour chapters without losing completed hours', () => {
    const started = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state
    const education = started.education as Record<string, unknown>
    const active = education.activeEducation as Record<string, unknown>
    active.steps = [
      { id: 'stage_1', title: 'Этап 1', hoursRequired: 3, progressPercent: 2 / 3 },
      { id: 'stage_2', title: 'Этап 2', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_3', title: 'Этап 3', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_4', title: 'Этап 4', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_5', title: 'Этап 5', hoursRequired: 2, progressPercent: 0 },
    ]

    const advanced = executor.execute(started, { type: 'education', payload: { action: 'advance' } })
    const migrated = (advanced.state.education as Record<string, unknown>).activeEducation as Record<string, unknown>
    const steps = migrated.steps as Array<Record<string, unknown>>

    expect(steps).toHaveLength(14)
    expect(migrated.currentStepIndex).toBe(3)
    expect(migrated.hoursRemaining).toBe(11)
  })

  it('allows a book to be reread three times with half reward, then blocks another reread', () => {
    let state = GameWorld.createEmpty().toJSON()

    for (let completion = 0; completion < 4; completion += 1) {
      state = executor.execute(state, {
        type: 'education',
        payload: { operation: 'start', programId: 'meditation_foundations_book' },
      }).state
      state = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } }).state

      for (let hour = 0; hour < 14; hour += 1) {
        state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state
        if (hour === 7) {
          state = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } }).state
        }
      }
    }

    const education = state.education as Record<string, unknown>
    const completions = education.completedPrograms as Array<Record<string, unknown>>
    const meditation = (state.skills as Record<string, unknown>).levels as Record<string, { level: number }>
    const fifthStart = executor.execute(state, {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    })

    expect(completions.filter(completion => completion.id === 'meditation_foundations_book')).toHaveLength(4)
    expect(completions.at(-1)).toEqual(expect.objectContaining({ completionNumber: 4, rewardMultiplier: 0.5 }))
    expect(meditation.meditation.level).toBe(2.5)
    expect(meditation.emotionalIntelligence.level).toBe(1.25)
    expect(fifthStart.result).toEqual({ success: false, message: 'Достигнут лимит повторного чтения: 4 прохождения' })
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
