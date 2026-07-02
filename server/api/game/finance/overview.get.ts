/**
 * GET /api/game/finance/overview — финансовый обзор мира.
 * Server-first migration, Stage 4.
 */
import { getFinanceOverview } from '@/application/game/queries'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { FinanceOverviewDto } from '@/application/game/index.types'

export default defineEventHandler(async (event): Promise<FinanceOverviewDto> => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  return getFinanceOverview(world)
})
