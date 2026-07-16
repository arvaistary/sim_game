/**
 * POST /api/game/actions/execute — выполнить action над миром.
 * Server-first migration, Stage 4.
 *
 * Body: { actionId: string }
 * Загружает мир из session, выполняет action через domain command,
 * сохраняет, возвращает результат + обновлённое состояние.
 */
import { executeActionCommand } from '@/domain/game-world/commands'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse, ActionExecuteResponse, ActionExecuteRequest } from '../../types'
import type { ExecuteActionResult } from '@/domain/game-world/commands/commands.types'
import { okResponse } from '../../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<ActionExecuteResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const body: ActionExecuteRequest = await readBody(event)
  const actionId: string | undefined = body?.actionId

  if (!actionId || typeof actionId !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'actionId is required',
      data: { code: 'validation_error' },
    })
  }

  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  const result: ExecuteActionResult = executeActionCommand(world, actionId)
  await saveWorldForSession(sessionId, world)

  return okResponse({
    result: { success: result.success, message: result.message },
    state: world.toJSON(),
  })
})
