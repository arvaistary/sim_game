import type { ApiResponse, GameStateResponse, SyncResponse } from '@game-life/contracts'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { createStandaloneApp } from '../../../apps/server/src/app'
import type { GameWorldJSON } from '../../../src/domain/game-world/GameWorld.types'
import type { StandaloneInjectResponse } from './app.test.types'

describe('standalone server', () => {
  it('preserves init, cookie session, state and sync flow', async () => {
    const app: FastifyInstance = await createStandaloneApp({ corsOrigins: [] })

    try {
      const initResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/init',
        payload: {},
      })
      const initBody: ApiResponse<GameStateResponse<GameWorldJSON>> = JSON.parse(initResponse.body) as ApiResponse<GameStateResponse<GameWorldJSON>>
      const setCookieHeader: string | string[] | undefined = initResponse.headers['set-cookie']
      const cookieValue: string = Array.isArray(setCookieHeader)
        ? setCookieHeader[0].split(';')[0]
        : String(setCookieHeader ?? '').split(';')[0]

      expect(initResponse.statusCode).toBe(200)
      expect(initBody.success).toBe(true)
      expect(cookieValue).toMatch(/^gl_session=/)

      const stateResponse: StandaloneInjectResponse = await app.inject({
        method: 'GET',
        url: '/api/game/state',
        headers: { cookie: cookieValue },
      })
      const stateBody: ApiResponse<GameStateResponse<GameWorldJSON>> = JSON.parse(stateResponse.body) as ApiResponse<GameStateResponse<GameWorldJSON>>

      expect(stateResponse.statusCode).toBe(200)
      expect(stateBody.data?.stateVersion).toBe(0)

      const syncResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: cookieValue },
        payload: { actions: [] },
      })
      const syncBody: ApiResponse<SyncResponse<GameWorldJSON>> = JSON.parse(syncResponse.body) as ApiResponse<SyncResponse<GameWorldJSON>>

      expect(syncResponse.statusCode).toBe(200)
      expect(syncBody.data?.stateVersion).toBe(1)
      expect(syncBody.data?.applied).toBe(0)
    } finally {
      await app.close()
    }
  })
})
