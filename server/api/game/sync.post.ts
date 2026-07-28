/**
 * POST /api/game/sync — применить offline queue действий.
 * Server-first migration, Stage 4.
 *
 * Body: { actions: QueuedAction[] }
 * Применяет действия по очереди, возвращает финальное состояние.
 */
import type { ApiResponse, SyncRequest, SyncResponse, ErrorResponse } from '../types'
import { okResponse } from '../../utils/error-handler'
import { getGameStateService, getPersistenceRepository } from '../../utils/persistence'

export default defineEventHandler(async (event): Promise<ApiResponse<SyncResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const body: SyncRequest = await readBody(event).catch(() => ({ actions: [] })) ?? { actions: [] }
  const existing = await getPersistenceRepository().findByPlayerId(sessionId)

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  let applied: number = 0
  let failed: number = 0
  const errors: ErrorResponse[] = []
  const service = getGameStateService()

  for (const queuedAction of body.actions ?? []) {
    try {
      const result = await service.execute(sessionId, sessionId, {
        commandId: queuedAction.commandId ?? crypto.randomUUID(),
        expectedStateVersion: queuedAction.expectedStateVersion,
        type: queuedAction.type,
        payload: queuedAction.payload,
      })
      if (!result.result.success) {
        throw new Error(result.result.message)
      }
      applied++
    } catch (error) {
      failed++
      errors.push({
        code: 'internal_error',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const current = (await getPersistenceRepository().findByPlayerId(sessionId)) ?? existing
  return okResponse({
    state: current.state,
    stateVersion: current.stateVersion,
    applied,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  })
})

// executeActionCommand is now dispatched by injected GameCommandExecutor.
