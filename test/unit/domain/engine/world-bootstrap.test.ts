import { describe, expect, test } from 'vitest'
import { INITIAL_SAVE } from '@/domain/balance/constants/initial-save'
import { createWorldFromSave } from '@/domain/game-facade'

describe('domain/engine world bootstrap', () => {
  test('creates world instance from save payload', () => {
    const world = createWorldFromSave({ playerName: 'Tester' })
    expect(world).toBeTruthy()
  })

  test('partial save (name only) merges INITIAL_SAVE so stats and time components exist', () => {
    const world = createWorldFromSave({ playerName: 'Tester' })
    const stats = world.getComponent<Record<string, number>>('player', 'stats')
    expect(stats).toBeTruthy()
    expect(stats?.hunger).toBe(INITIAL_SAVE.stats.hunger)
    const time = world.getComponent<Record<string, unknown>>('player', 'time')
    expect(time).toBeTruthy()
  })

  test('new game without job adds unemployed work and career', () => {
    const world = createWorldFromSave({ playerName: 'Tester', currentJob: null })
    const work = world.getComponent<Record<string, unknown>>('player', 'work')
    expect(work?.id).toBeNull()
    expect(work?.employed).toBe(false)
    const career = world.getComponent<Record<string, unknown>>('player', 'career')
    expect(career?.employed).toBe(false)
  })

  test('materializes work and career from legacy currentJob-only save', () => {
    const save = {
      playerName: 'LegacyTester',
      currentJob: {
        id: 'office_employee',
        name: 'Офисный сотрудник',
        employed: true,
        schedule: '5/2',
        salaryPerHour: 1050,
        salaryPerDay: 8400,
        salaryPerWeek: 42000,
        requiredHoursPerWeek: 40,
        workedHoursCurrentWeek: 8,
      },
    }

    const world = createWorldFromSave(save as Record<string, unknown>)
    const work = world.getComponent<Record<string, unknown>>('player', 'work')
    const career = world.getComponent<Record<string, unknown>>('player', 'career')
    expect(work).toBeTruthy()
    expect(career).toBeTruthy()
    expect(work?.id).toBe('office_employee')
    expect(career?.id).toBe('office_employee')
  })

  test('sparse legacy save: only currentJob.id merges INITIAL_SAVE time and stats', () => {
    const save = {
      playerName: 'SparseFields',
      currentJob: {
        id: 'office_employee',
      },
    }

    const world = createWorldFromSave(save as Record<string, unknown>)
    const work = world.getComponent<Record<string, unknown>>('player', 'work')
    const career = world.getComponent<Record<string, unknown>>('player', 'career')
    const time = world.getComponent<Record<string, unknown>>('player', 'time')
    const stats = world.getComponent<Record<string, unknown>>('player', 'stats')

    expect(work?.id).toBe('office_employee')
    expect(career?.id).toBe('office_employee')
    expect(time).toBeTruthy()
    expect(typeof time?.totalHours).toBe('number')
    expect(stats).toBeTruthy()
    expect(stats?.hunger).toBe(INITIAL_SAVE.stats.hunger)
  })

  test.todo('restores pending events and investments from save payload')
})
