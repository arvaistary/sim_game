import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './apps/server/src/infrastructure/persistence/schema.ts',
  out: './apps/server/src/infrastructure/persistence/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://game:game@127.0.0.1:5432/game_life',
  },
  strict: true,
  verbose: true,
})
