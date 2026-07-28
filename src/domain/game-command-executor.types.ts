import type { GameWorldJSON } from './game-world/GameWorld.types'

export type PersistedGameCommandType = 'action' | 'work' | 'event' | 'career' | 'finance' | 'education'

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
