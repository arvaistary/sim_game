/**
 * GET /api/game/career/track — карьерный трек игрока.
 * Server-first migration, Stage 4.
 */
import { getCareerTrack } from '@/application/game/queries'
import type { GameWorld } from '@/domain/game-world/GameWorld'

export default defineEventHandler(async (event) => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return getCareerTrack(world)
})
