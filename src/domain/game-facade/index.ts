/**
 * game-facade — тонкая обёртка над GameWorld для application layer.
 *
 * Предоставляет фабрики создания мира и helper-геттеры для query-команд.
 * Domain-only: без импортов Vue/Nuxt/Pinia.
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON, GameWorldSnapshot } from '@/domain/game-world/GameWorld.types'
import type { GameFacade } from './game-facade.types'

export type { GameFacade } from './game-facade.types'

/**
 * Создать GameWorld из JSON (десериализация сейва).
 * @description [Domain] - фабрика GameWorld из сохранения.
 * @return { GameWorld } восстановленный мир
 */
export function createWorldFromJSON(json: GameWorldJSON): GameWorld {
  return GameWorld.fromJSON(json)
}

/**
 * Создать пустой GameWorld (init state для новой игры).
 * @description [Domain] - фабрика пустого мира.
 * @return { GameWorld } пустой мир
 */
export function createEmptyWorld(initial?: Partial<GameWorldSnapshot>): GameWorld {
  return GameWorld.createEmpty(initial)
}

/**
 * Получить фасад над существующим GameWorld с helper-геттерами.
 * @description [Domain] - helper-обёртка для application queries.
 * @return { GameFacade } фасад с геттерами
 */
export function getGameFacade(world: GameWorld): GameFacade {
  return {
    world,
    toJSON: () => world.toJSON(),
    toSnapshot: () => world.toSnapshot(),
  }
}
