import type { FastifyInstance } from 'fastify'

export type StandaloneInjectResponse = Awaited<ReturnType<FastifyInstance['inject']>>
