import { STATS_COMPONENT, PLAYER_ENTITY } from '../components/index'
import { summarizeStatChanges } from '../policies/stat-change-summary'
import type { ECSWorld } from '../world'
import type { StatChanges, StatDef } from '@/domain/balance/types'

/**
 * Система управления статистикой
 * Применяет изменения к статам с clamp в пределах 0-100
 */
export class StatsSystem {
  private world!: ECSWorld

  statDefs: StatDef[] = [
    { key: 'hunger', label: 'Голод', startColor: '#FF9F6B', endColor: '#FF6B6B' },
    { key: 'energy', label: 'Энергия', startColor: '#6D9DC5', endColor: '#4A7C9E' },
    { key: 'stress', label: 'Стресс', startColor: '#E87D7D', endColor: '#D14D4D' },
    { key: 'mood', label: 'Настроение', startColor: '#F4D95F', endColor: '#E8B94A' },
    { key: 'health', label: 'Здоровье', startColor: '#7ED9A0', endColor: '#4EBF7A' },
    { key: 'physical', label: 'Форма', startColor: '#A8CABA', endColor: '#6FAE91' },
  ]

  init(world: ECSWorld): void {
    this.world = world
  }

  /**
   * Применить изменения статистики к игроку
   */
  applyStatChanges(statChanges: StatChanges = {}): void {
    const playerId = PLAYER_ENTITY
    const stats = this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
    if (!stats) return

    for (const [key, value] of Object.entries(statChanges)) {
      if (value === undefined) continue
      stats[key] = this._clamp((stats[key] ?? 0) + value)
    }
  }

  /**
   * Получить текущую статистику
   */
  getStats(): Record<string, number> | null {
    const playerId = PLAYER_ENTITY
    return this.world.getComponent(playerId, STATS_COMPONENT) as Record<string, number> | null
  }

  /**
   * Создать строку с описанием изменений
   */
  summarizeStatChanges(statChanges: StatChanges = {}): string {
    return summarizeStatChanges(statChanges)
  }

  /**
   * Объединить несколько наборов изменений
   */
  mergeStatChanges(...chunks: (StatChanges | null | undefined)[]): StatChanges {
    return chunks.reduce<StatChanges>((accumulator, chunk) => {
      Object.entries(chunk ?? {}).forEach(([key, value]) => {
        if (value === undefined) return
        accumulator[key] = (accumulator[key] ?? 0) + value
      })
      return accumulator
    }, {})
  }

  /**
   * Ограничить значение в пределах min-max
   */
  _clamp(value: number, min = 0, max = 100): number {
    return Math.max(min, Math.min(max, value))
  }
}

