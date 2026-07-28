import { describe, expect, it } from 'vitest'
import { formatGameDays } from '@/utils/format'

describe('formatGameDays', () => {
  it.each([
    [0, '0 дней'],
    [364, '364 дня'],
    [365, '1 год'],
    [366, '1 год, 1 день'],
    [729, '1 год, 364 дня'],
    [730, '2 года'],
  ])('форматирует %i дней', (days, expected) => {
    expect(formatGameDays(days)).toBe(expected)
  })
})
