/**
 * GET /api/game/career/track — карьерный трек игрока.
 * Server-first migration, Stage 4.
 */
import { getCareerTrack } from '@/application/game/queries'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse } from '../../types'
import { okResponse } from '../../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<Array<Record<string, unknown>>>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return okResponse(getCareerTrack(world))
})
