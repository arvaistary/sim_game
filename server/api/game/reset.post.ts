/**
 * POST /api/game/reset — starts a fresh cookie-backed game session.
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse, GameStateResponse } from '../types'
import { okResponse } from '../../utils/error-handler'
import { initializePersistentSession } from '../../utils/persistence'
import { rotateSessionId } from '../../utils/session'

export default defineEventHandler(async (event): Promise<ApiResponse<GameStateResponse>> => {
  const sessionId = rotateSessionId(event)
  const record = await initializePersistentSession(sessionId, GameWorld.createEmpty().toJSON(), true)

  return okResponse({
    state: record.state,
    sessionId,
    version: record.state.version,
    stateVersion: record.stateVersion,
  })
})
