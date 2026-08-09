import { describe, expect, it } from 'vitest'

import type { GameEventPayload, ResolveEventResult } from '@/domain/game-world/commands'
import { GameWorld } from '@/domain/game-world/GameWorld'
import { resolveEventDecisionCommand } from '@/domain/game-world/commands'

function createEmployedWorld(): GameWorld {
  const world: GameWorld = GameWorld.createEmpty({
    wallet: { money: 1_000, totalEarnings: 0, totalSpent: 0, reserveFund: 0 },
    career: {
      currentJob: {
        id: 'job',
        name: 'Job',
        schedule: '5/2',
        employed: true,
        salaryPerHour: 100,
        salaryPerWeek: 4_000,
        salaryPerDay: 800,
        requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 0,
        pendingSalaryWeek: 0,
        totalWorkedHours: 0,
        level: 1,
        daysAtWork: 0,
      },
      jobHistory: [],
      careerLevel: 1,
      promotions: 0,
    },
  })

  return world
}

describe('resolveEventDecisionCommand', () => {
  it('T027 resolving job_dismissal ends current career employment', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'job_dismissal',
      title: 'Увольнение с работы',
      choices: [
        {
          id: 'job_dismissal_take_break',
          text: 'Взять перерыв',
          outcome: 'Вы решили взять перерыв от работы.',
        },
      ],
    }

    const result: ResolveEventResult = resolveEventDecisionCommand(world, event, 'job_dismissal_take_break')

    expect(result.success).toBe(true)
    expect(world.career.currentJob.employed).toBe(false)
    expect(world.career.currentJob.id).toBe('unemployed')
  })

  it('removes pending event and marks instance seen after resolve', () => {
    const world: GameWorld = createEmployedWorld()
    const event: GameEventPayload = {
      id: 'weekly_summary',
      instanceId: 'weekly_summary_42',
      title: 'Итоги недели',
      choices: [
        {
          id: 'ack',
          text: 'Понятно',
          outcome: 'Неделя закрыта',
        },
      ],
    }

    world.events.pending.push(event)

    const result: ResolveEventResult = resolveEventDecisionCommand(world, event, 'ack')

    expect(result.success).toBe(true)
    expect(world.events.pending).toHaveLength(0)
    expect(world.events.state.seenEventIds).toContain('weekly_summary_42')
    expect(world.events.history).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: 'weekly_summary_42',
          templateId: 'weekly_summary',
          choiceId: 'ack',
        }),
      ]),
    )
  })
})
