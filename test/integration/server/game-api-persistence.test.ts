import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { createStandaloneApp } from '../../../apps/server/src/app'
import { MemoryGameStateRepository } from '../../../apps/server/src/session-repository'
import type { StandaloneInjectResponse } from '../standalone-server/app.test.types'

describe('game API persistence scenarios', () => {
  it('keeps ten initialized sessions across a new Fastify instance', async () => {
    const repository = new MemoryGameStateRepository()
    const firstApp: FastifyInstance = await createStandaloneApp({ repository, corsOrigins: [] })
    const cookies: string[] = []
    try {
      for (let index = 0; index < 10; index++) {
        const init: StandaloneInjectResponse = await firstApp.inject({ method: 'POST', url: '/api/game/init', payload: {} })
        const header = init.headers['set-cookie']
        const cookie = (Array.isArray(header) ? header[0] : String(header)).split(';')[0]
        cookies.push(cookie)
        await firstApp.inject({
          method: 'POST',
          url: '/api/game/actions/execute',
          headers: { cookie },
          payload: { actionId: 'self_morning_routine', commandId: `persist-${index}`, expectedStateVersion: 0 },
        })
      }
    } finally {
      await firstApp.close()
    }

    const secondApp: FastifyInstance = await createStandaloneApp({ repository, corsOrigins: [] })
    try {
      for (const cookie of cookies) {
        const response: StandaloneInjectResponse = await secondApp.inject({ method: 'GET', url: '/api/game/state', headers: { cookie } })
        expect(response.statusCode).toBe(200)
        expect(JSON.parse(response.body).data.stateVersion).toBe(1)
      }
      const isolated: StandaloneInjectResponse = await secondApp.inject({
        method: 'GET',
        url: '/api/game/state',
        headers: { cookie: 'gl_session=unrelated-session' },
      })
      expect(isolated.statusCode).toBe(404)
    } finally {
      await secondApp.close()
    }
  })
})
