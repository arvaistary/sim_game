import { getQuery } from 'h3'
import { getActivityLog } from '@/application/game/queries'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse } from '../types'
import type { ActivityEntry } from '@/domain/game-world/GameWorld.types'
import { okResponse } from '../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<ActivityEntry[]>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  const query = getQuery(event)
  const filter: string | undefined = typeof query.filter === 'string' ? query.filter : undefined
  const rawLimit: number = Number(query.limit ?? query.count ?? 10)
  const limit: number = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 10

  return okResponse(getActivityLog(world, filter, limit))
})
