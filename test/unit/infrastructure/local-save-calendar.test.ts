import { beforeEach, describe, expect, it } from 'vitest'
import { createLocalStorageSaveRepository } from '@/infrastructure/persistence/LocalStorageSaveRepository'
import type { SaveRepository } from '@/application/game/ports/SaveRepository.types'

describe('local save calendar draft', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('restores calendarPlan after a repository reload', () => {
    const repository: SaveRepository = createLocalStorageSaveRepository('calendar-test')
    const payload: Record<string, unknown> = {
      calendarPlan: {
        days: [{ sleepHours: 7, workHours: 8, actionIds: ['fun_park_walk'] }],
      },
    }

    repository.save(payload)

    const reloaded: Record<string, unknown> | null = createLocalStorageSaveRepository('calendar-test').load()

    expect(reloaded?.calendarPlan).toEqual(payload.calendarPlan)
  })
})
