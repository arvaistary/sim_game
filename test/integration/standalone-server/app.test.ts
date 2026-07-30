import type { ApiResponse, GameStateResponse, SyncResponse } from '@game-life/contracts'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { createStandaloneApp } from '../../../apps/server/src/app'
import type { GameWorldJSON } from '../../../src/domain/game-world/GameWorld.types'
import { GameWorld } from '../../../src/domain/game-world/GameWorld'
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

  it('creates a new cookie session and empty world on reset', async () => {
    const app: FastifyInstance = await createStandaloneApp({ corsOrigins: [] })

    try {
      const initResponse: StandaloneInjectResponse = await app.inject({ method: 'POST', url: '/api/game/init', payload: {} })
      const oldCookie = (Array.isArray(initResponse.headers['set-cookie'])
        ? initResponse.headers['set-cookie'][0]
        : String(initResponse.headers['set-cookie'])).split(';')[0]
      await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: oldCookie },
        payload: { actions: [{ type: 'education', payload: { programId: 'meditation_foundations_book', action: 'start' }, timestamp: Date.now() }] },
      })

      const resetResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/reset',
        headers: { cookie: oldCookie },
      })
      const resetBody: ApiResponse<GameStateResponse<GameWorldJSON>> = JSON.parse(resetResponse.body) as ApiResponse<GameStateResponse<GameWorldJSON>>
      const newCookie = (Array.isArray(resetResponse.headers['set-cookie'])
        ? resetResponse.headers['set-cookie'][0]
        : String(resetResponse.headers['set-cookie'])).split(';')[0]

      expect(resetResponse.statusCode).toBe(200)
      expect(newCookie).not.toBe(oldCookie)
      expect(resetBody.data?.state.education.activeCourses).toEqual([])
      expect(resetBody.data?.state.education.completedPrograms).toEqual([])
    } finally {
      await app.close()
    }
  })

  it('executes book purchase and career sync against initialized session', async () => {
    const app: FastifyInstance = await createStandaloneApp({ corsOrigins: [] })

    try {
      const initResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/init',
        payload: {},
      })
      const setCookieHeader: string | string[] | undefined = initResponse.headers['set-cookie']
      const cookieValue: string = Array.isArray(setCookieHeader)
        ? setCookieHeader[0].split(';')[0]
        : String(setCookieHeader ?? '').split(';')[0]

      const initialWorld: GameWorld = GameWorld.createEmpty()
      initialWorld.player.startAge = 18
      initialWorld.player.currentAge = 18
      initialWorld.wallet.money = 5000
      const replaceResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/init',
        headers: { cookie: cookieValue },
        payload: { saveData: initialWorld.toJSON(), replace: true },
      })
      expect(replaceResponse.statusCode).toBe(200)

      const purchaseResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/actions/execute',
        headers: { cookie: cookieValue },
        payload: { actionId: 'shop_meditation_foundations_book' },
      })
      const purchaseBody = JSON.parse(purchaseResponse.body) as ApiResponse<GameWorldJSON>
      expect(purchaseResponse.statusCode).toBe(200)
      expect(purchaseBody.data?.result.success).toBe(true)
      expect(purchaseBody.data?.state.housing.furniture).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: 'book_meditation_foundations', purchased: true })]),
      )

      const startReadingResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: cookieValue },
        payload: {
          actions: [{ type: 'education', payload: { programId: 'meditation_foundations_book', action: 'start' }, timestamp: Date.now() }],
        },
      })
      const startReadingBody = JSON.parse(startReadingResponse.body) as ApiResponse<SyncResponse<GameWorldJSON>>
      expect(startReadingResponse.statusCode).toBe(200)
      expect(startReadingBody.data?.applied).toBe(1)
      expect((startReadingBody.data?.state.education as Record<string, unknown>).activeEducation).toEqual(
        expect.objectContaining({ id: 'meditation_foundations_book' }),
      )

      const readResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: cookieValue },
        payload: {
          actions: [{ type: 'education', payload: { action: 'advance' }, timestamp: Date.now() }],
        },
      })
      const readBody = JSON.parse(readResponse.body) as ApiResponse<SyncResponse<GameWorldJSON>>
      const activeEducation = (readBody.data?.state.education as Record<string, unknown>).activeEducation as Record<string, unknown>
      expect(readResponse.statusCode).toBe(200)
      expect(readBody.data?.applied).toBe(1)
      expect((activeEducation.steps as Array<Record<string, unknown>>)[0]?.progressPercent).toBeGreaterThan(0)

      const careerResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: cookieValue },
        payload: {
          actions: [{ type: 'career', payload: { jobId: 'it_junior', action: 'change' }, timestamp: Date.now() }],
        },
      })
      const careerBody = JSON.parse(careerResponse.body) as ApiResponse<GameWorldJSON>
      expect(careerResponse.statusCode).toBe(200)
      expect(careerBody.data?.applied).toBe(1)
      expect(careerBody.data?.state.career.currentJob.id).toBe('it_junior')

      const workResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/sync',
        headers: { cookie: cookieValue },
        payload: {
          actions: [{ type: 'work', payload: { hours: 8 }, timestamp: Date.now() }],
        },
      })
      const workBody = JSON.parse(workResponse.body) as ApiResponse<GameWorldJSON>
      expect(workResponse.statusCode).toBe(200)
      expect(workBody.data?.applied).toBe(1)
      expect(workBody.data?.state.wallet.money).toBeGreaterThan(5000)
    } finally {
      await app.close()
    }
  })
})
