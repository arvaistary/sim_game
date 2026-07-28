/**
 * POST /api/game/actions/execute — выполнить action над миром.
 * Server-first migration, Stage 4.
 *
 * Body: { actionId: string }
 * Загружает мир из session, выполняет action через domain command,
 * сохраняет, возвращает результат + обновлённое состояние.
 */
import type { ApiResponse, ActionExecuteResponse, ActionExecuteRequest } from '../../types'
import { okResponse } from '../../../utils/error-handler'
import { getGameStateService } from '../../../utils/persistence'

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

  const result = await getGameStateService().execute(sessionId, sessionId, {
    commandId: body.commandId ?? crypto.randomUUID(),
    expectedStateVersion: body.expectedStateVersion,
    type: 'action',
    payload: { actionId },
  })

  return okResponse({
    result: result.result,
    state: result.state,
    stateVersion: result.stateVersion,
  })
})

// executeActionCommand is now injected through GameCommandExecutor.
