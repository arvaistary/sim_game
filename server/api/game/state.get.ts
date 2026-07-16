/**
 * GET /api/game/state — получить текущее состояние мира.
 * Server-first migration, Stage 4.
 *
 * Cookie-based session. Если сессия/мир не найден — возвращает 404,
 * клиент должен вызвать POST /api/game/init.
 */
import type { ApiResponse, GameStateResponse } from '../types'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import { okResponse } from '../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<GameStateResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return okResponse({
    state: world.toJSON(),
    sessionId,
    version: '1.0',
  })
})
