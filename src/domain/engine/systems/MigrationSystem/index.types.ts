import type { GameWorld } from '../../world'

export type MigrationFn = (saveData: Record<string, unknown>) => Record<string, unknown>

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Маппер ECS → плоский save (см. plans/persistence-migration-refresh-plan.md).
 * toSave/toECS можно добавить позже для двунаправленного registry; сейчас syncFromWorld — канонический путь записи.
 */
export interface ComponentMapper {
  component: string
  toSave?(ecsData: unknown): unknown
  toECS?(saveData: unknown): unknown
  /** Запись компонента игрока в плоский save-объект */
  syncFromWorld(world: GameWorld, playerId: string, saveData: Record<string, unknown>): void
}
