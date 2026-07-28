import cookie from '@fastify/cookie'
import cors from '@fastify/cors'
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify'
import type {
  ActionExecuteRequest,
  ActionExecuteResponse,
  ApiResponse,
  GameStateResponse,
  SyncRequest,
  SyncResponse, CommandResultDto 
} from '@game-life/contracts'

import { GameStateService, CommandIdConflictError, SessionNotFoundError as ApplicationSessionNotFoundError, StateVersionConflictError } from '@game-life/application'
import type { CommandServiceResult, GameCommandRequest, GameStateRecord, GameStateRepository  } from '@game-life/application'
import { GameCommandExecutor } from '@/domain/game-command-executor'
import type { GameWorld } from '@/domain/game-world/GameWorld'
import type { GameWorldJSON, ActivityEntry } from '@/domain/game-world/GameWorld.types'
import { getActivityLog, getCareerTrack, getFinanceOverview, getInvestments } from './game-queries'
import type { StandaloneFinanceOverview, StandaloneInvestments } from './game-queries.types'
import {
  MemoryGameStateRepository,
  MemoryUnitOfWork,
  SessionNotFoundError,
  SessionStateConflictError,
} from './session-repository'
import { hashCommandRequest } from './infrastructure/persistence/request-hash'
import { PersistenceError } from './infrastructure/persistence/persistence-errors'

import type {
  ActivityQuery,
  InitBody,
  LoadedWorld,
  PersistenceReadiness,
  StandaloneApiErrorOptions,
  StandaloneServerOptions,
} from './app.types'

const SESSION_COOKIE: string = 'gl_session'

class StandaloneApiError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: Record<string, unknown>

  public constructor(options: StandaloneApiErrorOptions) {
    super(options.message)
    this.name = 'StandaloneApiError'
    this.statusCode = options.statusCode
    this.code = options.code
    this.details = options.details
  }
}

/**
 * @description Create standalone Fastify API with current memory repository adapter.
 * @return { FastifyInstance } Configured Fastify application.
 */
export async function createStandaloneApp(
  options: StandaloneServerOptions = {},
): Promise<FastifyInstance> {
  const app: FastifyInstance = Fastify({ logger: true })
  const repository: GameStateRepository<GameWorldJSON> = options.repository ?? new MemoryGameStateRepository()
  const service: GameStateService<GameWorldJSON, CommandResultDto> = options.service ?? new GameStateService({
    unitOfWork: options.unitOfWork ?? new MemoryUnitOfWork<CommandResultDto>(repository),
    executor: new GameCommandExecutor(),
    requestHash: hashCommandRequest,
  })
  const corsOrigins: string[] = options.corsOrigins ?? readCorsOrigins()

  await app.register(cookie)
  await app.register(cors, {
    credentials: true,
    origin: corsOrigins.length > 0 ? corsOrigins : true,
  })

  app.setErrorHandler((error: Error & { statusCode?: number }, _request, reply) => {
    const apiError: ApiResponse<never> = createErrorResponse(error)
    const statusCode: number = error instanceof StandaloneApiError
      ? error.statusCode
      : error instanceof SessionNotFoundError
        ? 404
        : error instanceof ApplicationSessionNotFoundError
          ? 404
        : error instanceof SessionStateConflictError
          ? 409
          : error instanceof CommandIdConflictError || error instanceof StateVersionConflictError
            ? 409
            : error instanceof PersistenceError && error.code === 'not_found'
              ? 404
              : error instanceof PersistenceError && error.code === 'conflict'
                ? 409
                : error instanceof PersistenceError && error.code === 'unavailable'
                  ? 503
          : error.statusCode && error.statusCode >= 400
            ? error.statusCode
            : 500
    void reply.status(statusCode).send(apiError)
  })

  app.get('/health', async (_request, reply) => reply.send({
    status: 'ok',
    service: 'game-life-api',
    transport: 'fastify',
    timestamp: Date.now(),
  }))

  app.get('/ready', async (_request, reply) => reply.send({
    ...(await readyPayload(options.readiness, reply)),
  }))

  registerGameRoutes(app, repository, service)
  return app
}

function registerGameRoutes(
  app: FastifyInstance,
  repository: GameStateRepository<GameWorldJSON>,
  service: GameStateService<GameWorldJSON, CommandResultDto>,
): void {
  app.get('/api/game/state', async (request, reply) => {
    const sessionId: string = getOrCreateSessionId(request, reply)
    const loaded: LoadedWorld | null = await loadWorld(repository, sessionId)

    if (!loaded) throw sessionNotFound(sessionId)

    const response: GameStateResponse<GameWorldJSON> = toStateResponse(sessionId, loaded)
    return reply.send(okResponse(response))
  })

  app.post('/api/game/init', async (request: FastifyRequest<{ Body: InitBody }>, reply) => {
    const sessionId: string = getOrCreateSessionId(request, reply)
    const body: InitBody = request.body ?? {}
    const existing: GameStateRecord<GameWorldJSON> | null = await repository.findByPlayerId(sessionId)

    if (existing && !body.replace) {
      const { GameWorld } = await import('@/domain/game-world/GameWorld')
      return reply.send(okResponse(toStateResponse(sessionId, { record: existing, world: GameWorld.fromJSON(existing.state) })))
    }
    const world: GameWorld = body.saveData
      ? (await import('@/domain/game-world/GameWorld')).GameWorld.fromJSON(body.saveData)
      : (await import('@/domain/game-world/GameWorld')).GameWorld.createEmpty()
    const record: GameStateRecord<GameWorldJSON> = {
      sessionId,
      playerId: sessionId,
      state: world.toJSON(),
      schemaVersion: 1,
      stateVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }

    if (existing && body.replace) {
      const replaced: GameStateRecord<GameWorldJSON> = await repository.saveIfVersionMatches(
        existing.sessionId,
        existing.stateVersion,
        world.toJSON(),
      )
      return reply.send(okResponse(toStateResponse(sessionId, { record: replaced, world })))
    }

    await repository.create(record)
    return reply.send(okResponse(toStateResponse(sessionId, { record, world })))
  })

  app.post('/api/game/actions/execute', async (
    request: FastifyRequest<{ Body: ActionExecuteRequest }>,
    reply: FastifyReply,
  ) => {
    const sessionId: string = getOrCreateSessionId(request, reply)
    const actionId: string | undefined = request.body?.actionId

    if (!actionId || typeof actionId !== 'string') {
      throw validationError('actionId is required')
    }

    const loaded: LoadedWorld | null = await loadWorld(repository, sessionId)

    if (!loaded) throw sessionNotFound(sessionId)

    const command: GameCommandRequest = {
      commandId: request.body.commandId ?? crypto.randomUUID(),
      expectedStateVersion: request.body.expectedStateVersion,
      type: 'action',
      payload: { actionId },
    }
    const result: CommandServiceResult<GameWorldJSON, CommandResultDto> = await service.execute(sessionId, sessionId, command)
    const response: ActionExecuteResponse<GameWorldJSON> = {
      result: result.result,
      state: result.state,
      stateVersion: result.stateVersion,
    }
    return reply.send(okResponse(response))
  })

  app.post('/api/game/sync', async (
    request: FastifyRequest<{ Body: SyncRequest }>,
    reply: FastifyReply,
  ) => {
    const sessionId: string = getOrCreateSessionId(request, reply)
    const loaded: LoadedWorld | null = await loadWorld(repository, sessionId)

    if (!loaded) throw sessionNotFound(sessionId)

    const body: SyncRequest = request.body ?? { actions: [] }

    if (!Array.isArray(body.actions)) throw validationError('actions must be an array')

    let applied: number = 0
    let failed: number = 0
    const errors: Array<{ code: string; message: string }> = []

    for (const queuedAction of body.actions) {
      try {
        const command: GameCommandRequest = {
          commandId: queuedAction.commandId ?? crypto.randomUUID(),
          expectedStateVersion: queuedAction.expectedStateVersion,
          type: queuedAction.type,
          payload: queuedAction.payload,
        }
        const result: CommandServiceResult<GameWorldJSON, CommandResultDto> = await service.execute(sessionId, sessionId, command)

        if (!result.result.success) {
          failed++
          errors.push({ code: 'validation_error', message: result.result.message })
        } else {
          applied++
        }
      } catch (error) {
        failed++
        errors.push({
          code: error instanceof StateVersionConflictError ? 'state_version_conflict' : 'internal_error',
          message: error instanceof Error ? error.message : String(error),
        })
      }
    }

    const saved: GameStateRecord<GameWorldJSON> = body.actions.length === 0
      ? await saveWorld(repository, loaded)
      : (await repository.findByPlayerId(sessionId) ?? loaded.record)
    const response: SyncResponse<GameWorldJSON> = {
      state: saved.state,
      stateVersion: saved.stateVersion,
      applied,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    }
    return reply.send(okResponse(response))
  })

  registerQueryRoutes(app, repository)
}

function registerQueryRoutes(
  app: FastifyInstance,
  repository: GameStateRepository<GameWorldJSON>,
): void {
  app.get('/api/game/career/track', async (request, reply) => {
    const loaded: LoadedWorld | null = await loadWorld(repository, getSessionId(request))

    if (!loaded) throw sessionNotFound(getSessionId(request))
    return reply.send(okResponse(getCareerTrack(loaded.world)))
  })

  app.get('/api/game/finance/overview', async (request, reply) => {
    const loaded: LoadedWorld | null = await loadWorld(repository, getSessionId(request))

    if (!loaded) throw sessionNotFound(getSessionId(request))
    const overview: StandaloneFinanceOverview = getFinanceOverview(loaded.world)
    return reply.send(okResponse(overview))
  })

  app.get('/api/game/investments', async (request, reply) => {
    const loaded: LoadedWorld | null = await loadWorld(repository, getSessionId(request))

    if (!loaded) throw sessionNotFound(getSessionId(request))
    const investments: StandaloneInvestments = getInvestments(loaded.world)
    return reply.send(okResponse(investments))
  })

  app.get('/api/game/activity-log', async (
    request: FastifyRequest<{ Querystring: ActivityQuery }>,
    reply,
  ) => {
    const sessionId: string = getSessionId(request)
    const loaded: LoadedWorld | null = await loadWorld(repository, sessionId)

    if (!loaded) throw sessionNotFound(sessionId)
    const query: ActivityQuery = request.query ?? {}
    const rawLimit: number = Number(query.limit ?? query.count ?? 10)
    const limit: number = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 100) : 10
    const entries: ActivityEntry[] = getActivityLog(loaded.world, query.filter, limit)
    return reply.send(okResponse(entries))
  })
}

async function loadWorld(
  repository: GameStateRepository<GameWorldJSON>,
  sessionId: string,
): Promise<LoadedWorld | null> {
  const record: GameStateRecord<GameWorldJSON> | null = await repository.findByPlayerId(sessionId)

  if (!record) return null
  const { GameWorld } = await import('@/domain/game-world/GameWorld')
  return { record, world: GameWorld.fromJSON(record.state) }
}

async function saveWorld(
  repository: GameStateRepository<GameWorldJSON>,
  loaded: LoadedWorld,
): Promise<GameStateRecord<GameWorldJSON>> {
  return repository.saveIfVersionMatches(
    loaded.record.sessionId,
    loaded.record.stateVersion,
    loaded.world.toJSON(),
  )
}

function getOrCreateSessionId(request: FastifyRequest, reply: FastifyReply): string {
  const existing: string | undefined = request.cookies?.[SESSION_COOKIE]

  if (existing) return existing

  const sessionId: string = crypto.randomUUID()
  reply.setCookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: readCookieSameSite(),
    secure: readBooleanEnv('GAME_COOKIE_SECURE', false),
    maxAge: 86400,
    path: '/',
  })
  return sessionId
}

function getSessionId(request: FastifyRequest): string {
  return request.cookies?.[SESSION_COOKIE] ?? ''
}

function toStateResponse(sessionId: string, loaded: LoadedWorld): GameStateResponse<GameWorldJSON> {
  return {
    state: loaded.record.state,
    sessionId,
    version: loaded.record.state.version,
    stateVersion: loaded.record.stateVersion,
  }
}

function okResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data, timestamp: Date.now() }
}

function createErrorResponse(error: Error & { statusCode?: number }): ApiResponse<never> {

  if (error instanceof StandaloneApiError) {
    return {
      success: false,
      error: { code: error.code, message: error.message, details: error.details },
      timestamp: Date.now(),
    }
  }

  if (error instanceof SessionNotFoundError) {
    return {
      success: false,
      error: { code: 'session_not_found', message: error.message },
      timestamp: Date.now(),
    }
  }

  if (error instanceof SessionStateConflictError) {
    return {
      success: false,
      error: {
        code: 'state_version_conflict',
        message: error.message,
        details: {
          expectedStateVersion: error.expectedStateVersion,
          actualStateVersion: error.actualStateVersion,
        },
      },
      timestamp: Date.now(),
    }
  }

  if (error instanceof ApplicationSessionNotFoundError) {
    return {
      success: false,
      error: { code: 'session_not_found', message: error.message },
      timestamp: Date.now(),
    }
  }

  if (error instanceof CommandIdConflictError) {
    return {
      success: false,
      error: { code: 'command_id_conflict', message: error.message },
      timestamp: Date.now(),
    }
  }

  if (error instanceof StateVersionConflictError) {
    return {
      success: false,
      error: {
        code: 'state_version_conflict',
        message: error.message,
        details: {
          expectedStateVersion: error.expectedStateVersion,
          actualStateVersion: error.actualStateVersion,
        },
      },
      timestamp: Date.now(),
    }
  }

  if (error instanceof PersistenceError) {
    return {
      success: false,
      error: {
        code: error.code === 'unavailable' ? 'persistence_unavailable' : error.code === 'conflict' ? 'state_version_conflict' : 'session_not_found',
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      timestamp: Date.now(),
    }
  }

  return {
    success: false,
    error: { code: 'internal_error', message: error.message },
    timestamp: Date.now(),
  }
}

function sessionNotFound(sessionId: string): StandaloneApiError {
  return new StandaloneApiError({ statusCode: 404, code: 'session_not_found', message: `Session not found: ${sessionId}` })
}

function validationError(message: string): StandaloneApiError {
  return new StandaloneApiError({ statusCode: 400, code: 'validation_error', message })
}

function readCorsOrigins(): string[] {
  return String(process.env.GAME_CORS_ORIGINS ?? 'http://127.0.0.1:3000,http://localhost:3000')
    .split(',')
    .map((origin: string) => origin.trim())
    .filter((origin: string) => origin.length > 0)
}

async function readyPayload(
  readiness: StandaloneServerOptions['readiness'],
  reply: FastifyReply,
): Promise<Record<string, unknown>> {
  const state: PersistenceReadiness = readiness
    ? await readiness()
    : {
        status: 'ready' as const,
        schemaVersion: 0,
        appliedMigrations: 0,
        pendingMigrations: 0,
        database: 'reachable' as const,
      }

  if (state.status !== 'ready') reply.status(503)
  return {
    status: state.status,
    dependencies: { stateRepository: state.database },
    schemaVersion: state.schemaVersion,
    appliedMigrations: state.appliedMigrations,
    pendingMigrations: state.pendingMigrations,
    timestamp: Date.now(),
    ...(state.reason ? { reason: state.reason } : {}),
  }
}

function readCookieSameSite(): 'lax' | 'strict' | 'none' {
  const value: string = String(process.env.GAME_COOKIE_SAME_SITE ?? 'lax')
  return value === 'strict' || value === 'none' ? value : 'lax'
}

function readBooleanEnv(name: string, fallback: boolean): boolean {
  const value: string | undefined = process.env[name]
  return value === undefined ? fallback : value === 'true'
}
