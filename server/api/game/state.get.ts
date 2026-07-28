/**
 * GET /api/game/state — получить текущее состояние мира.
 * Server-first migration, Stage 4.
 *
 * Cookie-based session. Если сессия/мир не найден — возвращает 404,
 * клиент должен вызвать POST /api/game/init.
 */
import type { ApiResponse, GameStateResponse } from '../types'
import { okResponse } from '../../utils/error-handler'
import { getPersistenceRepository } from '../../utils/persistence'

export default defineEventHandler(async (event): Promise<ApiResponse<GameStateResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const record = await getPersistenceRepository().findByPlayerId(sessionId)

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return okResponse({
    state: record.state,
    sessionId,
    version: record.state.version,
    stateVersion: record.stateVersion,
  })
})

// loadWorldForSession remains compatibility API for read-model callers.
