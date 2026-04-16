import { describe, expect, test, beforeEach } from 'vitest'
import { telemetryInc, telemetryGetCounters, telemetryReset } from '@/domain/engine/utils/telemetry'

describe('telemetry module', () => {
  beforeEach(() => {
    telemetryReset()
  })

  test('telemetryInc increments counter', () => {
    telemetryInc('test_counter')
    expect(telemetryGetCounters()['test_counter']).toBe(1)
  })

  test('telemetryInc increments with custom delta', () => {
    telemetryInc('test_counter', 5)
    expect(telemetryGetCounters()['test_counter']).toBe(5)
  })

  test('telemetryInc accumulates multiple calls', () => {
    telemetryInc('test_counter')
    telemetryInc('test_counter')
    telemetryInc('test_counter')
    expect(telemetryGetCounters()['test_counter']).toBe(3)
  })

  test('telemetryReset clears all counters', () => {
    telemetryInc('a')
    telemetryInc('b')
    telemetryReset()
    expect(Object.keys(telemetryGetCounters())).toHaveLength(0)
  })

  test('telemetryGetCounters returns a copy', () => {
    telemetryInc('test')
    const counters = telemetryGetCounters() as Record<string, number>
    counters.test = 999
    expect(telemetryGetCounters()['test']).toBe(1)
  })
})
