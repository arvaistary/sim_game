import { describe, expect, test, beforeEach } from 'vitest'
import { ActionAvailabilityCache, resetGlobalActionAvailabilityCache, getGlobalActionAvailabilityCache } from '@/domain/engine/systems/ActionSystem/ActionAvailabilityCache'

describe('ActionAvailabilityCache', () => {
  let cache: ActionAvailabilityCache

  beforeEach(() => {
    resetGlobalActionAvailabilityCache()
    cache = new ActionAvailabilityCache(0)
  })

  describe('basic operations', () => {
    test('returns null for uncached action', () => {
      const result = cache.get('test_action')
      expect(result).toBeNull()
    })

    test('stores and retrieves availability', () => {
      cache.set('test_action', { available: true, reason: undefined })
      const result = cache.get('test_action')
      expect(result).toEqual({ available: true, reason: undefined, worldVersion: 0 })
    })

    test('stores and retrieves unavailability with reason', () => {
      cache.set('test_action', { available: false, reason: 'No money' })
      const result = cache.get('test_action')
      expect(result).toEqual({ available: false, reason: 'No money', worldVersion: 0 })
    })

    test('handles multiple actions', () => {
      cache.set('action1', { available: true })
      cache.set('action2', { available: false, reason: 'No time' })
      cache.set('action3', { available: true })

      expect(cache.get('action1')).toEqual({ available: true, worldVersion: 0 })
      expect(cache.get('action2')).toEqual({ available: false, reason: 'No time', worldVersion: 0 })
      expect(cache.get('action3')).toEqual({ available: true, worldVersion: 0 })
    })
  })

  describe('world version tracking', () => {
    test('invalidates cache when world version changes', () => {
      cache.set('test_action', { available: true })
      
      // Cache should be valid initially
      expect(cache.get('test_action')).not.toBeNull()
      
      // Update world version
      cache.updateWorldVersion(1)
      
      // Cache should be invalidated
      expect(cache.get('test_action')).toBeNull()
    })

    test('does not invalidate when world version is same', () => {
      cache.set('test_action', { available: true })
      cache.updateWorldVersion(0)
      
      expect(cache.get('test_action')).not.toBeNull()
    })

    test('tracks multiple version updates', () => {
      cache.set('action1', { available: true })
      cache.updateWorldVersion(1)
      
      cache.set('action2', { available: false, reason: 'No money' })
      cache.updateWorldVersion(2)
      
      // Both should be invalidated
      expect(cache.get('action1')).toBeNull()
      expect(cache.get('action2')).toBeNull()
    })

    test('stores new entries with updated world version', () => {
      cache.set('action1', { available: true })
      cache.updateWorldVersion(1)
      
      cache.set('action1', { available: false, reason: 'No time' })
      const result = cache.get('action1')
      
      expect(result).toEqual({ available: false, reason: 'No time', worldVersion: 1 })
    })
  })

  describe('invalidation', () => {
    test('invalidates specific action', () => {
      cache.set('action1', { available: true })
      cache.set('action2', { available: false, reason: 'No money' })
      
      cache.invalidateAction('action1')
      
      expect(cache.get('action1')).toBeNull()
      expect(cache.get('action2')).not.toBeNull()
    })

    test('invalidates all actions', () => {
      cache.set('action1', { available: true })
      cache.set('action2', { available: false, reason: 'No money' })
      cache.set('action3', { available: true })
      
      cache.invalidate()
      
      expect(cache.get('action1')).toBeNull()
      expect(cache.get('action2')).toBeNull()
      expect(cache.get('action3')).toBeNull()
    })
  })

  describe('statistics', () => {
    test('tracks hits and misses', () => {
      cache.set('action1', { available: true })
      
      cache.get('action1') // hit
      cache.get('action2') // miss
      cache.get('action1') // hit
      cache.get('action3') // miss
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(2)
      expect(stats.misses).toBe(2)
    })

    test('calculates hit rate correctly', () => {
      cache.set('action1', { available: true })
      
      cache.get('action1') // hit
      cache.get('action2') // miss
      cache.get('action1') // hit
      
      const stats = cache.getStats()
      expect(stats.hitRate).toBeCloseTo(2/3, 2)
    })

    test('tracks invalidations', () => {
      cache.set('action1', { available: true })
      cache.invalidate()
      cache.updateWorldVersion(1)
      
      const stats = cache.getStats()
      expect(stats.invalidations).toBe(2)
    })

    test('tracks cache size', () => {
      cache.set('action1', { available: true })
      cache.set('action2', { available: false, reason: 'No money' })
      cache.set('action3', { available: true })
      
      const stats = cache.getStats()
      expect(stats.size).toBe(3)
    })

    test('resets statistics', () => {
      cache.set('action1', { available: true })
      cache.get('action1')
      cache.invalidate()
      
      cache.resetStats()
      
      const stats = cache.getStats()
      expect(stats.hits).toBe(0)
      expect(stats.misses).toBe(0)
      expect(stats.invalidations).toBe(0)
    })
  })

  describe('enable/disable', () => {
    test('is enabled by default when feature flag is true', () => {
      expect(cache.isEnabled()).toBe(true)
    })

    test('does not cache when disabled', () => {
      cache.setEnabled(false)
      
      cache.set('action1', { available: true })
      expect(cache.get('action1')).toBeNull()
    })

    test('clears cache when disabled', () => {
      cache.set('action1', { available: true })
      cache.setEnabled(false)
      
      const stats = cache.getStats()
      expect(stats.size).toBe(0)
    })

    test('can be re-enabled', () => {
      cache.setEnabled(false)
      cache.setEnabled(true)
      
      cache.set('action1', { available: true })
      expect(cache.get('action1')).not.toBeNull()
    })
  })

  describe('reporting', () => {
    test('generates report', () => {
      cache.set('action1', { available: true })
      cache.get('action1')
      cache.get('action2')
      
      const report = cache.getReport()
      expect(report).toContain('Action Availability Cache Report')
      expect(report).toContain('Включён')
      expect(report).toContain('Hits: 1')
      expect(report).toContain('Misses: 1')
    })

    test('shows disabled status in report', () => {
      cache.setEnabled(false)
      
      const report = cache.getReport()
      expect(report).toContain('Выключен')
    })
  })

  describe('edge cases', () => {
    test('handles empty reason', () => {
      cache.set('action1', { available: false, reason: '' })
      const result = cache.get('action1')
      
      expect(result).toEqual({ available: false, reason: '', worldVersion: 0 })
    })

    test('handles undefined reason', () => {
      cache.set('action1', { available: true, reason: undefined })
      const result = cache.get('action1')
      
      expect(result).toEqual({ available: true, reason: undefined, worldVersion: 0 })
    })

    test('handles large number of actions', () => {
      const count = 1000
      for (let i = 0; i < count; i++) {
        cache.set(`action_${i}`, { available: i % 2 === 0 })
      }
      
      const stats = cache.getStats()
      expect(stats.size).toBe(count)
    })

    test('handles rapid world version changes', () => {
      for (let i = 0; i < 100; i++) {
        cache.set('action1', { available: true })
        cache.updateWorldVersion(i)
      }
      
      expect(cache.get('action1')).toBeNull()
      expect(cache.getStats().invalidations).toBe(100)
    })
  })
})

describe('Global cache instance', () => {
  beforeEach(() => {
    resetGlobalActionAvailabilityCache()
  })

  test('returns same instance across calls', () => {
    const cache1 = getGlobalActionAvailabilityCache()
    const cache2 = getGlobalActionAvailabilityCache()
    
    expect(cache1).toBe(cache2)
  })

  test('resets global instance', () => {
    const cache1 = getGlobalActionAvailabilityCache()
    cache1.set('action1', { available: true })
    
    resetGlobalActionAvailabilityCache()
    
    const cache2 = getGlobalActionAvailabilityCache()
    expect(cache2.get('action1')).toBeNull()
  })
})
