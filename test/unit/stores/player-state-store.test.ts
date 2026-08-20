import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { usePlayerStateStore } from '@/stores/player-state-store'

describe('usePlayerStateStore job search weekly limit', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('preserves lastJobSearchGameWeek when clearing search results', () => {
    const store = usePlayerStateStore()

    store.recordJobSearch({
      gameWeek: 5,
      channelId: 'newspaper',
      vacancyIds: ['it_junior'],
    })

    store.clearJobSearch()

    expect(store.jobSearch.lastJobSearchGameWeek).toBe(5)
    expect(store.jobSearch.savedVacancyIds).toEqual([])
    expect(store.canSearchJobsThisWeek(5)).toBe(false)
    expect(store.canSearchJobsThisWeek(6)).toBe(true)
  })

  it('resets weekly limit only on full reset', () => {
    const store = usePlayerStateStore()

    store.recordJobSearch({
      gameWeek: 3,
      channelId: 'job_center',
      vacancyIds: [],
    })
    store.reset()

    expect(store.jobSearch.lastJobSearchGameWeek).toBeNull()
    expect(store.canSearchJobsThisWeek(3)).toBe(true)
  })
})
