/**
 * POST /api/game/sync — применить offline queue действий.
 * Server-first migration, Stage 4.
 *
 * Body: { actions: QueuedAction[] }
 * Применяет действия по очереди, возвращает финальное состояние.
 */
import { executeActionCommand } from '@/domain/game-world/commands'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { SyncRequest, SyncResponse, ErrorResponse } from '../types'
import type { ExecuteActionResult } from '@/domain/game-world/commands/commands.types'

export default defineEventHandler(async (event): Promise<SyncResponse> => {
  const sessionId: string = getOrCreateSessionId(event)
  const body: SyncRequest = await readBody(event)
  const world: GameWorld | null = await loadWorldForSession(sessionId)

  if (!world) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Session not found',
      data: { code: 'session_not_found' },
    })
  }

  let applied: number = 0
  let failed: number = 0
  const errors: ErrorResponse[] = []

  for (const queuedAction of body.actions ?? []) {
    try {
      if (queuedAction.type === 'action') {
        const actionId: string = String(queuedAction.payload.actionId ?? '')
        const _result: ExecuteActionResult = executeActionCommand(world, actionId)
        applied++
      } else {
        failed++
        errors.push({
          code: 'validation_error',
          message: `Unsupported action type: ${queuedAction.type}`,
        })
      }
    } catch (error) {
      failed++
      errors.push({
        code: 'internal_error',
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await saveWorldForSession(sessionId, world)

  const state: GameWorldJSON = world.toJSON()
  return { state, applied, failed, errors: errors.length > 0 ? errors : undefined }
})
