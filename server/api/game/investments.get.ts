/**
 * GET /api/game/investments — список инвестиций мира.
 * Server-first migration, Stage 4.
 */
import { getInvestments } from '@/application/game/queries'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { Investment } from '@/domain/balance/constants/default-save'

export default defineEventHandler(async (event): Promise<Investment[]> => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return getInvestments(world)
})
