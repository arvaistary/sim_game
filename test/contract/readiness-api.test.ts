import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('readiness contract wiring', () => {
  it('keeps liveness separate from persistence readiness', async () => {
    const health = await readFile('server/api/health.get.ts', 'utf8')
    const ready = await readFile('server/api/ready.get.ts', 'utf8')
    const standalone = await readFile('apps/server/src/app.ts', 'utf8')

    expect(health).toContain("status: 'ok'")
    expect(ready).toContain('getPersistenceReadiness')
    expect(ready).toContain('statusCode: 503')
    expect(standalone).toContain("app.get('/ready'")
    expect(standalone).toContain('schemaVersion')
    expect(standalone).not.toContain('DATABASE_URL')
  })
})
