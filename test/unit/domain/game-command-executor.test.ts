import { describe, expect, it } from 'vitest'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { GameCommandExecutor } from '@/domain/game-command-executor'
import { advanceHours } from '@/domain/game-world/commands'
import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { GameCommandExecution } from '@/domain/game-command-executor.types'

describe('GameCommandExecutor', () => {
  const executor: GameCommandExecutor = new GameCommandExecutor()

  it.each([
    ['action', { actionId: 'missing' }],
    ['work', { hours: 8 }],
    ['event', { choiceId: 'missing', event: null }],
    ['career', { jobId: 'missing' }],
    ['finance', { actionId: 'missing' }],
  ] as const)('maps %s command to domain handler', (type, payload) => {
    const result: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), { type, payload })

    expect(result.result).toEqual(expect.objectContaining({ success: false }))
    expect(result.state.version).toBeDefined()
  })

  it('maps education command and returns updated snapshot', () => {
    const result: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'test-program' },
    })

    expect(result.result).toEqual(expect.objectContaining({ success: true }))
    expect((result.state.education as Record<string, unknown>).activeEducation).toEqual(
      expect.objectContaining({ id: 'test-program' }),
    )
  })

  it('keeps catalog steps and completes meditation book after all study hours', () => {
    const started: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    })
    const active: Record<string, unknown> = (started.state.education as Record<string, unknown>).activeEducation as Record<string, unknown>

    expect(active).toEqual(expect.objectContaining({
      id: 'meditation_foundations_book',
      name: 'Книга «Основы медитации»',
      hoursTotal: 14,
      currentStepIndex: 0,
    }))
    expect(active.steps).toHaveLength(14)
    expect((active.steps as Array<Record<string, unknown>>)[0]?.content).toContain('Определите, зачем вам нужна практика')

    let state: GameWorldJSON = executor.execute(started.state, { type: 'education', payload: { action: 'advance' } }).state
    const activeAfterFirstChapter: Record<string, unknown> = (state.education as Record<string, unknown>).activeEducation as Record<string, unknown>
    expect(activeAfterFirstChapter.currentStepIndex).toBe(1)
    expect((activeAfterFirstChapter.steps as Array<Record<string, unknown>>)[0]?.progressPercent).toBe(1)

    for (let hour = 1; hour < 14; hour += 1) {
      state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state

      if (hour === 7) {
        state = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } }).state
      }
    }

    const education: Record<string, unknown> = state.education as Record<string, unknown>
    expect(education.activeEducation).toBeNull()
    expect(education.completedPrograms).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'meditation_foundations_book', name: 'Книга «Основы медитации»' }),
    ]))
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { level: number }>).meditation.level).toBe(1)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, { xp: number }>).meditation.xp).toBe(50)
    expect(((state.skills as Record<string, unknown>).levels as Record<string, unknown>).emotionalIntelligence).toBeUndefined()
  })

  it('tracks study hours until sleep and resets them after a sleep action', () => {
    let state: GameWorldJSON = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state

    for (let hour = 0; hour < 8; hour += 1) {
      state = executor.execute(state, { type: 'education', payload: { action: 'advance' } }).state
    }

    const blocked: GameCommandExecution = executor.execute(state, { type: 'education', payload: { action: 'advance' } })
    expect((state.education as Record<string, unknown>).studyHoursSinceLastSleep).toBe(8)
    expect(blocked.result).toEqual({ success: false, message: 'Лимит учёбы исчерпан. Поспите для восстановления.' })

    const slept: GameCommandExecution = executor.execute(state, { type: 'action', payload: { actionId: 'fun_sleep_normal' } })
    expect(slept.result.success).toBe(true)
    expect((slept.state.education as Record<string, unknown>).studyHoursSinceLastSleep).toBe(0)
    expect((slept.state.education as Record<string, unknown>).cognitiveLoad).toBe(0)
  })

  it('blocks education when cognitive load reaches its cap even if wake-cycle data is stale', () => {
    const started: GameWorldJSON = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state
    const education: Record<string, unknown> = started.education as Record<string, unknown>
    education.cognitiveLoad = 80
    education.studyHoursSinceLastSleep = 0

    const blocked: GameCommandExecution = executor.execute(started, { type: 'education', payload: { action: 'advance' } })

    expect(blocked.result).toEqual({
      success: false,
      message: 'Когнитивная нагрузка слишком высока. Поспите для восстановления.',
    })
  })

  it('upgrades an in-progress legacy book to one-hour chapters without losing completed hours', () => {
    const started: GameWorldJSON = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    }).state
    const education: Record<string, unknown> = started.education as Record<string, unknown>
    const active: Record<string, unknown> = education.activeEducation as Record<string, unknown>
    active.steps = [
      { id: 'stage_1', title: 'Этап 1', hoursRequired: 3, progressPercent: 2 / 3 },
      { id: 'stage_2', title: 'Этап 2', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_3', title: 'Этап 3', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_4', title: 'Этап 4', hoursRequired: 3, progressPercent: 0 },
      { id: 'stage_5', title: 'Этап 5', hoursRequired: 2, progressPercent: 0 },
    ]

    const advanced: GameCommandExecution = executor.execute(started, { type: 'education', payload: { action: 'advance' } })
    const migrated: Record<string, unknown> = (advanced.state.education as Record<string, unknown>).activeEducation as Record<string, unknown>
    const steps: Array<Record<string, unknown>> = migrated.steps as Array<Record<string, unknown>>

    expect(steps).toHaveLength(14)
    expect(migrated.currentStepIndex).toBe(3)
    expect(migrated.hoursRemaining).toBe(11)
  })

  it('allows a book to be reread three times with half reward, then blocks another reread', () => {
    let state: GameWorldJSON = GameWorld.createEmpty().toJSON()

    for (let completion = 0; completion < 4; completion += 1) {
      if (completion > 0) {
        const currentHours: number = state.time.dayHoursRemaining
        const world: GameWorld = GameWorld.fromJSON(state)
        advanceHours(world, currentHours, 'idle')
        state = world.toJSON()
      }

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

    const education: Record<string, unknown> = state.education as Record<string, unknown>
    const completions: Array<Record<string, unknown>> = education.completedPrograms as Array<Record<string, unknown>>
    const meditation: Record<string, { level: number }> = (state.skills as Record<string, unknown>).levels as Record<string, { level: number }>
    const fifthStart: GameCommandExecution = executor.execute(state, {
      type: 'education',
      payload: { operation: 'start', programId: 'meditation_foundations_book' },
    })

    expect(completions.filter(completion => completion.id === 'meditation_foundations_book')).toHaveLength(4)
    expect(completions.at(-1)).toEqual(expect.objectContaining({ completionNumber: 4, rewardMultiplier: 0.5 }))
    expect(meditation.meditation.level).toBe(1)
    expect(meditation.emotionalIntelligence).toBeUndefined()
    expect(fifthStart.result).toEqual({ success: false, message: 'Достигнут лимит повторного чтения: 4 прохождения' })
  })

  it('returns validation result for invalid payload instead of mutating state', () => {
    const state: GameWorldJSON = GameWorld.createEmpty().toJSON()
    const result: GameCommandExecution = executor.execute(state, { type: 'work', payload: { hours: '8' } as unknown as Record<string, unknown> })

    expect(result.result.success).toBe(false)
    expect(result.state).toEqual(state)
  })

  it('advances neutral time without sleep debt and recalculates age', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.time.totalHours = 365 * 24
    world.time.sleepDebt = 20

    const result: GameCommandExecution = executor.execute(world.toJSON(), { type: 'time', payload: { hours: 24 } })

    expect(result.result.success).toBe(true)
    expect(result.state.time.sleepDebt).toBe(20)
    expect(result.state.player.currentAge).toBe(19)
  })

  it('supports career quit, finance settlement and education advance subcommands', () => {
    const started: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'education',
      payload: { operation: 'start', programId: 'test-program' },
    })
    const advanced: GameCommandExecution = executor.execute(started.state, { type: 'education', payload: { operation: 'advance' } })
    const quit: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), { type: 'career', payload: { operation: 'quit' } })
    const quitViaAction: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), { type: 'career', payload: { action: 'quit' } })
    const settled: GameCommandExecution = executor.execute(GameWorld.createEmpty().toJSON(), {
      type: 'finance',
      payload: { action: 'monthly_settlement' },
    })

    expect(advanced.result.success).toBe(true)
    expect(quit.result.success).toBe(true)
    expect(quitViaAction.result.success).toBe(true)
    expect(quitViaAction.state.career.currentJob.employed).toBe(false)
    expect(settled.result.success).toBe(true)
  })

  it('enforces career age and education requirements in the domain', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.player.currentAge = 18
    world.skills.levels.professionalism = { level: 10, xp: 0 }

    const ageBlocked: GameCommandExecution = executor.execute(world.toJSON(), {
      type: 'career',
      payload: { jobId: 'it_middle' },
    })

    expect(ageBlocked.result).toEqual({ success: false, message: 'Требуется возраст 22+' })

    world.player.currentAge = 22
    const educationBlocked: GameCommandExecution = executor.execute(world.toJSON(), {
      type: 'career',
      payload: { jobId: 'it_middle' },
    })

    expect(educationBlocked.result).toEqual({ success: false, message: 'Требуется образование: Среднее' })

    world.education.educationLevel = 'school'
    const started: GameCommandExecution = executor.execute(world.toJSON(), {
      type: 'career',
      payload: { jobId: 'it_middle' },
    })

    expect(started.result.success).toBe(true)
  })

  it('applies day_end_hooks command to events wallet finance and career slices', () => {
    const world: GameWorld = GameWorld.createEmpty()
    advanceHours(world, 24, 'idle')
    const snapshot: GameWorldSnapshot = world.toSnapshot()

    snapshot.events.pending.push({
      id: 'weekly_summary',
      instanceId: 'weekly_summary_1',
      type: 'weekly',
      title: 'Summary',
      description: 'Week done',
      choices: [],
    })
    snapshot.events.state.lastWeeklyEventWeek = 1
    snapshot.career.currentJob.workedHoursCurrentWeek = 12

    const result: GameCommandExecution = executor.execute(world.toJSON(), {
      type: 'day_end_hooks',
      payload: {
        dayNumber: 1,
        events: snapshot.events,
        wallet: snapshot.wallet,
        finance: snapshot.finance,
        career: snapshot.career,
      },
    })

    expect(result.result.success).toBe(true)
    expect(result.state.events.pending).toHaveLength(1)
    expect((result.state.events.pending[0] as { id: string }).id).toBe('weekly_summary')
    expect(result.state.events.state.lastWeeklyEventWeek).toBe(1)
    expect(result.state.career.currentJob.workedHoursCurrentWeek).toBe(12)
  })

  it('resolves event by eventId from pending queue without explicit payload', () => {
    const world: GameWorld = GameWorld.createEmpty()
    world.events.pending.push({
      id: 'micro_break',
      instanceId: 'micro_break_1',
      type: 'micro',
      title: 'Перерыв',
      choices: [
        {
          id: 'rest',
          text: 'Отдохнуть',
          statChanges: { energy: 3 },
        },
      ],
    })

    const result: GameCommandExecution = executor.execute(world.toJSON(), {
      type: 'event',
      payload: { eventId: 'micro_break', choiceId: 'rest' },
    })

    expect(result.result.success).toBe(true)
    expect(result.state.events.pending).toHaveLength(0)
    expect(result.state.events.state.seenEventIds).toContain('micro_break_1')
    expect(result.state.events.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          templateId: 'micro_break',
          choiceId: 'rest',
        }),
      ]),
    )
  })
})
