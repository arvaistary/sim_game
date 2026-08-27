/**
 * Public API модуля game-world.
 *
 * ADR-0005 (Strategy A): GameWorld — единый source of truth состояния игры.
 * Domain-only, без зависимостей от Vue/Nuxt/Pinia.
 */
export { GameWorld, GAME_WORLD_VERSION } from './GameWorld'
export type {
  ActivityEntry,
  GameWorldJSON,
  GameWorldSnapshot,
  PlayerSlice,
  SkillLevels,
} from './GameWorld.types'
export { fromStores, applyToStores } from './bridge'
export type { StoresLoadTarget, StoresSnapshot } from './bridge'
export * from './commands/index'
export * from './life'
export * from '@/domain/meta-progression'
