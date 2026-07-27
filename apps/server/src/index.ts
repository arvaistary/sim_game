import { createStandaloneApp } from './app'
import type { FastifyInstance } from 'fastify'

const port: number = Number(process.env.API_PORT ?? 3001)
const host: string = process.env.API_HOST ?? '127.0.0.1'
const app: FastifyInstance = await createStandaloneApp()

await app.listen({ port, host })
console.log(`Game Life standalone API listening on http://${host}:${port}`)
