import { describe, expect, it } from 'vitest'
import { getDayRhythm } from '@/components/pages/dashboard/DayPlannerSummary/day-rhythm'
import type { DayRhythmStats } from '@/components/pages/dashboard/DayPlannerSummary/DayPlannerSummary.types'

const HEALTHY_STATS: DayRhythmStats = { energy: 70, health: 80, hunger: 70, stress: 30, mood: 60, physical: 50 }

describe('getDayRhythm', () => {
  it('describes a calm day when the plan leaves enough room', () => {
    expect(getDayRhythm({ availableHours: 24, plannedHours: 7, freeHours: 17, stats: HEALTHY_STATS })).toMatchObject({
      tone: 'calm',
      title: 'Ритм спокойный',
    })
  })

  it('warns when the plan does not fit the remaining day', () => {
    expect(getDayRhythm({ availableHours: 12, plannedHours: 14, freeHours: 0, stats: HEALTHY_STATS })).toMatchObject({
      tone: 'overloaded',
      intro: 'Плану не хватит 2 ч — часть дел придётся перенести.',
    })
  })

  it('adds a tired tone when energy is low', () => {
    expect(getDayRhythm({
      availableHours: 24,
      plannedHours: 7,
      freeHours: 17,
      stats: { ...HEALTHY_STATS, energy: 20 },
    })).toMatchObject({
      tone: 'tired',
      title: 'Ритм восстановления',
    })
  })

  it('marks a full but valid plan as dense', () => {
    expect(getDayRhythm({ availableHours: 24, plannedHours: 22, freeHours: 2, stats: HEALTHY_STATS })).toMatchObject({
      tone: 'dense',
      title: 'Ритм плотный',
    })
  })
})
