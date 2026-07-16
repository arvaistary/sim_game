/**
 * POST /api/game/sync — применить offline queue действий.
 * Server-first migration, Stage 4.
 *
 * Body: { actions: QueuedAction[] }
 * Применяет действия по очереди, возвращает финальное состояние.
 */
import { executeActionCommand } from '@/domain/game-world/commands'
import {
  applyMonthlySettlement,
  changeCareer,
  collectInvestment,
  quitCareer,
  resolveEventDecision,
  startEducationProgram,
  advanceEducation,
  simulateWorkShift,
} from '@/application/game/commands'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'
import type { ApiResponse, SyncRequest, SyncResponse, ErrorResponse } from '../types'
import type { ExecuteActionResult } from '@/domain/game-world/commands/commands.types'
import { okResponse } from '../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<SyncResponse>> => {
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
      switch (queuedAction.type) {
        case 'action': {
          const actionId: string = String(queuedAction.payload.actionId ?? '')
          const result: ExecuteActionResult = executeActionCommand(world, actionId)
          if (!result.success) throw new Error(result.message)
          break
        }
        case 'work':
          simulateWorkShift(world, Number(queuedAction.payload.hours ?? 0))
          break
        case 'career': {
          const action: string = String(queuedAction.payload.action ?? 'change')
          if (action === 'quit') {
            const quitResult = quitCareer(world)
            if (!quitResult.success) throw new Error(quitResult.message)
          } else {
            const result = changeCareer(world, String(queuedAction.payload.jobId ?? ''))
            if (!result.success) throw new Error(result.message)
          }
          break
        }
        case 'finance':
          if (queuedAction.payload.action === 'collect') {
            collectInvestment(world, String(queuedAction.payload.investmentId ?? ''))
          } else if (queuedAction.payload.action === 'monthly_settlement') {
            applyMonthlySettlement(world)
          }
          break
        case 'event': {
          const result = resolveEventDecision(
            world,
            String(queuedAction.payload.eventId ?? ''),
            null,
            String(queuedAction.payload.choiceId ?? ''),
          )
          if (!result.success) throw new Error(result.message)
          break
        }
        case 'education':
          if (queuedAction.payload.action === 'start') {
            startEducationProgram(world, String(queuedAction.payload.programId ?? ''))
          } else {
            advanceEducation(world)
          }
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

  await saveWorldForSession(sessionId, world)

  const state: GameWorldJSON = world.toJSON()
  return okResponse({ state, applied, failed, errors: errors.length > 0 ? errors : undefined })
})
