import type { GameCommandType } from '@game-life/contracts'
import type { GameWorldJSON } from './game-world/GameWorld.types'

export type PersistedGameCommandType = GameCommandType

export interface PersistedGameCommand {
  type: PersistedGameCommandType
  payload: Record<string, unknown>
}

export interface PersistedCommandResult {
  success: boolean
  message: string
}

export interface GameCommandExecution {
  state: GameWorldJSON
  result: PersistedCommandResult
}
