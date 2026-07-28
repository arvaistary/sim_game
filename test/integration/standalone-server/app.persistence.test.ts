import type { ApiResponse, ActionExecuteResponse } from '@game-life/contracts'
import type { GameWorldJSON } from '../../../src/domain/game-world/GameWorld.types'
import type { FastifyInstance } from 'fastify'
import { describe, expect, it } from 'vitest'
import { createStandaloneApp } from '../../../apps/server/src/app'
import type { StandaloneInjectResponse } from './app.test.types'

describe('standalone durable command boundary', () => {
  it('replays duplicate command and rejects command id payload conflict', async () => {
    const app: FastifyInstance = await createStandaloneApp({ corsOrigins: [] })
    try {
      const init: StandaloneInjectResponse = await app.inject({ method: 'POST', url: '/api/game/init', payload: {} })
      const cookieHeader = init.headers['set-cookie']
      const cookie = (Array.isArray(cookieHeader) ? cookieHeader[0] : String(cookieHeader)).split(';')[0]

      const firstResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/actions/execute',
        headers: { cookie },
        payload: { actionId: 'self_morning_routine', commandId: 'cmd-retry', expectedStateVersion: 0 },
      })
      const first = JSON.parse(firstResponse.body) as ApiResponse<ActionExecuteResponse<GameWorldJSON>>

      const retryResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/actions/execute',
        headers: { cookie },
        payload: { actionId: 'self_morning_routine', commandId: 'cmd-retry', expectedStateVersion: 0 },
      })
      const retry = JSON.parse(retryResponse.body) as ApiResponse<ActionExecuteResponse<GameWorldJSON>>

      const conflictResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/actions/execute',
        headers: { cookie },
        payload: { actionId: 'self_public_speaking', commandId: 'cmd-retry', expectedStateVersion: 0 },
      })

      expect(firstResponse.statusCode).toBe(200)
      expect(retryResponse.statusCode).toBe(200)
      expect(first.data?.stateVersion).toBe(1)
      expect(retry.data?.stateVersion).toBe(1)
      expect(retry.data?.result).toEqual(first.data?.result)
      expect(conflictResponse.statusCode).toBe(409)
      expect(JSON.parse(conflictResponse.body).error.code).toBe('command_id_conflict')

      const staleResponse: StandaloneInjectResponse = await app.inject({
        method: 'POST',
        url: '/api/game/actions/execute',
        headers: { cookie },
        payload: { actionId: 'self_morning_routine', commandId: 'cmd-stale', expectedStateVersion: 0 },
      })
      expect(staleResponse.statusCode).toBe(409)
      expect(JSON.parse(staleResponse.body).error.code).toBe('state_version_conflict')
    } finally {
      await app.close()
    }
  })

  it('returns 503 when authoritative persistence is not ready', async () => {
    const app: FastifyInstance = await createStandaloneApp({
      corsOrigins: [],
      readiness: async () => ({
        status: 'not_ready',
        schemaVersion: 1,
        appliedMigrations: 0,
        pendingMigrations: 1,
        database: 'unreachable',
        reason: 'database_unreachable',
      }),
    })
    try {
      const response = await app.inject({ method: 'GET', url: '/ready' })
      expect(response.statusCode).toBe(503)
      expect(response.body).not.toContain('DATABASE_URL')
    } finally {
      await app.close()
    }
  })
})
