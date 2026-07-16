/**
 * POST /api/game/init — инициализировать новый мир или загрузить из saveData.
 * Server-first migration, Stage 4.
 *
 * Body (опционально): { saveData?: GameWorldJSON }
 * Если saveData передан — мир восстанавливается из него.
 * Иначе — создаётся пустой мир через GameWorld.createEmpty().
 */
import { GameWorld } from '@/domain/game-world/GameWorld'
import type { ApiResponse, GameStateResponse, InitRequestBody } from '../types'
import { okResponse } from '../../utils/error-handler'

export default defineEventHandler(async (event): Promise<ApiResponse<GameStateResponse>> => {
  const sessionId: string = getOrCreateSessionId(event)
  const body: InitRequestBody = await readBody(event).catch(() => ({})) ?? {}

  let world: GameWorld

  if (body.saveData) {
    world = GameWorld.fromJSON(body.saveData)
  } else {
    world = GameWorld.createEmpty()
  }

  await saveWorldForSession(sessionId, world)

  return okResponse({
    state: world.toJSON(),
    sessionId,
    version: '1.0',
  })
})
