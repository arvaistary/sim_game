import { STATS_COMPONENT, PLAYER_ENTITY } from '../../components/index'
import { summarizeStatChanges } from '../../utils/stat-change-summary'
import type { GameWorld } from '../../world'
import type { StatChanges, StatDef } from '@/domain/balance/types'
import { STAT_DEFS } from '@/domain/balance/constants/stat-defs'

/**
 * Система управления статистикой
 * Применяет изменения к статам с clamp в пределах 0-100
 */
export class StatsSystem {
  private world!: GameWorld

  statDefs: StatDef[] = STAT_DEFS

  init(world: GameWorld): void {
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

