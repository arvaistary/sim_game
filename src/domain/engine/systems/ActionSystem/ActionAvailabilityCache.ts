/**
 * ActionAvailabilityCache - кэш доступности действий по worldVersion
 * Позволяет избежать повторных вычислений доступности действий при каждом ререндере UI
 */

import { isTimeFeatureEnabled } from '@/config/feature-flags'

export interface CachedAvailability {
  available: boolean
  reason?: string
  worldVersion: number
}

export interface AvailabilityCacheEntry {
  actionId: string
  availability: CachedAvailability
  timestamp: number
}

export class ActionAvailabilityCache {
  private cache: Map<string, CachedAvailability>
  private currentWorldVersion: number
  private enabled: boolean
  private stats: {
    hits: number
    misses: number
    invalidations: number
  }

  constructor(initialWorldVersion = 0) {
    this.cache = new Map()
    this.currentWorldVersion = initialWorldVersion
    this.enabled = isTimeFeatureEnabled('availabilityCacheV2')
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    }
  }

  /**
   * Получить кэшированную доступность действия
   */
  get(actionId: string): CachedAvailability | null {
    if (!this.enabled) {
      return null
    }

    const cached = this.cache.get(actionId)
    
    if (!cached) {
      this.stats.misses++
      return null
    }

    // Проверяем, что кэш актуален для текущей версии мира
    if (cached.worldVersion !== this.currentWorldVersion) {
      this.cache.delete(actionId)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return cached
  }

  /**
   * Установить кэшированную доступность действия
   */
  set(actionId: string, availability: Omit<CachedAvailability, 'worldVersion'>): void {
    if (!this.enabled) {
      return
    }

    this.cache.set(actionId, {
      ...availability,
      worldVersion: this.currentWorldVersion,
    })
  }

  /**
   * Обновить версию мира и инвалидировать кэш
   */
  updateWorldVersion(newVersion: number): void {
    if (!this.enabled) {
      return
    }

    if (newVersion !== this.currentWorldVersion) {
      this.currentWorldVersion = newVersion
      this.cache.clear()
      this.stats.invalidations++
    }
  }

  /**
   * Инвалидировать весь кэш
   */
  invalidate(): void {
    if (!this.enabled) {
      return
    }

    this.cache.clear()
    this.stats.invalidations++
  }

  /**
   * Инвалидировать конкретное действие
   */
  invalidateAction(actionId: string): void {
    if (!this.enabled) {
      return
    }

    this.cache.delete(actionId)
  }

  /**
   * Получить статистику кэша
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits + this.stats.misses > 0
        ? this.stats.hits / (this.stats.hits + this.stats.misses)
        : 0,
    }
  }

  /**
   * Сбросить статистику
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
    }
  }

  /**
   * Включить/выключить кэш
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.cache.clear()
    }
  }

  /**
   * Проверить, включён ли кэш
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * Получить текущую версию мира
   */
  getCurrentWorldVersion(): number {
    return this.currentWorldVersion
  }

  /**
   * Получить отчёт по кэшу
   */
  getReport(): string {
    const stats = this.getStats()
    return [
      '=== Action Availability Cache Report ===',
      '',
      `Статус: ${this.enabled ? 'Включён' : 'Выключен'}`,
      `Текущая версия мира: ${this.currentWorldVersion}`,
      '',
      'Статистика:',
      `  Размер кэша: ${stats.size} записей`,
      `  Hits: ${stats.hits}`,
      `  Misses: ${stats.misses}`,
      `  Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`,
      `  Инвалидации: ${stats.invalidations}`,
    ].join('\n')
  }
}

// Глобальный экземпляр кэша
let globalCache: ActionAvailabilityCache | null = null

export function getGlobalActionAvailabilityCache(): ActionAvailabilityCache {
  if (!globalCache) {
    globalCache = new ActionAvailabilityCache()
  }
  return globalCache
}

export function resetGlobalActionAvailabilityCache(): void {
  globalCache = null
}
