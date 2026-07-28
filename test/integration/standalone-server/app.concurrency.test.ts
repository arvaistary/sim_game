import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { createStandaloneApp } from '../../../apps/server/src/app'
import type { StandaloneInjectResponse } from './app.test.types'

describe('standalone stale request contract', () => {
  it('returns state_version_conflict for stale expected version', async () => {
    const app: FastifyInstance = await createStandaloneApp({ corsOrigins: [] })
    try {
      const init: StandaloneInjectResponse = await app.inject({ method: 'POST', url: '/api/game/init', payload: {} })
      const header = init.headers['set-cookie']
      const cookie = (Array.isArray(header) ? header[0] : String(header)).split(';')[0]
      await app.inject({ method: 'POST', url: '/api/game/actions/execute', headers: { cookie }, payload: { actionId: 'self_morning_routine', commandId: 'fresh', expectedStateVersion: 0 } })
      const stale = await app.inject({ method: 'POST', url: '/api/game/actions/execute', headers: { cookie }, payload: { actionId: 'self_morning_routine', commandId: 'stale', expectedStateVersion: 0 } })

      expect(stale.statusCode).toBe(409)
      expect(JSON.parse(stale.body).error.code).toBe('state_version_conflict')
    } finally {
      await app.close()
    }
  })
})
