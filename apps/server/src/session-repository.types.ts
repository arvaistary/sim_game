import type { GameStateRecord } from '@game-life/application'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

export type StoredSession = GameStateRecord<GameWorldJSON>
