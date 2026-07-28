import 'dotenv/config'
import { createStandaloneApp } from './app'
import type { FastifyInstance } from 'fastify'
import type { CommandResultDto } from '@game-life/contracts'
import { GameStateService } from '@game-life/application'
import { GameCommandExecutor } from '@/domain/game-command-executor'
import { getPersistenceReadiness, getPool, closeDatabase } from './infrastructure/persistence/db'
import { PostgresGameStateRepository, PostgresUnitOfWork } from './infrastructure/persistence/postgres-repositories'
import { hashCommandRequest } from './infrastructure/persistence/request-hash'
import type { GameWorldJSON } from '@/domain/game-world/GameWorld.types'

const port: number = Number(process.env.API_PORT ?? 3001)
const host: string = process.env.API_HOST ?? '127.0.0.1'
const repository = new PostgresGameStateRepository<GameWorldJSON>(getPool())
const service = new GameStateService<GameWorldJSON, CommandResultDto>({
  unitOfWork: new PostgresUnitOfWork<GameWorldJSON, CommandResultDto>(getPool()),
  executor: new GameCommandExecutor(),
  requestHash: hashCommandRequest,
})
const app: FastifyInstance = await createStandaloneApp({ repository, service, readiness: getPersistenceReadiness })

app.addHook('onClose', async () => closeDatabase())

await app.listen({ port, host })
console.log(`Game Life standalone API listening on http://${host}:${port}`)
