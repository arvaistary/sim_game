import { getPersistenceReadiness } from '../../apps/server/src/infrastructure/persistence/db'

export default defineEventHandler(async (event) => {
  const readiness = await getPersistenceReadiness()
  if (readiness.status !== 'ready') {
    throw createError({
      statusCode: 503,
      statusMessage: 'Persistence is not ready',
      data: {
        code: 'persistence_unavailable',
        schemaVersion: readiness.schemaVersion,
        appliedMigrations: readiness.appliedMigrations,
        pendingMigrations: readiness.pendingMigrations,
        database: readiness.database,
      },
    })
  }
  void event
  return {
    status: 'ready',
    dependencies: { database: readiness.database },
    schemaVersion: readiness.schemaVersion,
    appliedMigrations: readiness.appliedMigrations,
    pendingMigrations: readiness.pendingMigrations,
    timestamp: Date.now(),
  }
})
