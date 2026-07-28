/**
 * POST /api/game/init — инициализировать новый мир или загрузить из saveData.
 * Server-first migration, Stage 4.
 *
 * Body (опционально): { saveData?: GameWorldJSON }
 * Если saveData передан — мир восстанавливается из него.
 * Иначе — создаётся пустой мир через GameWorld.createEmpty().
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse, GameStateResponse, InitRequestBody } from '../types'
import { okResponse } from '../../utils/error-handler'
import { initializePersistentSession } from '../../utils/persistence'

export default defineEventHandler(async (event): Promise<ApiResponse<GameStateResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const body: InitRequestBody = await readBody(event).catch(() => ({})) ?? {}

  let world: GameWorld

  if (body.saveData) {
    world = GameWorld.fromJSON(body.saveData)
  } else {
    world = GameWorld.createEmpty()
  }

  const record = await initializePersistentSession(sessionId, world.toJSON())

  return okResponse({
    state: record.state,
    sessionId,
    version: record.state.version,
    stateVersion: record.stateVersion,
  })
})

// saveWorldForSession remains compatibility API for older Nitro integrations.
