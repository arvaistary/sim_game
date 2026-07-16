import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const endpoints = [
  ['server/api/game/init.post.ts', 'defineEventHandler', 'saveWorldForSession'],
  ['server/api/game/state.get.ts', 'defineEventHandler', 'loadWorldForSession'],
  ['server/api/game/actions/execute.post.ts', 'actionId', 'executeActionCommand'],
  ['server/api/game/sync.post.ts', 'body.actions', 'executeActionCommand'],
  ['server/api/game/investments.get.ts', 'defineEventHandler', 'getInvestments'],
  ['server/api/game/career/track.get.ts', 'defineEventHandler', 'getCareerTrack'],
  ['server/api/game/finance/overview.get.ts', 'defineEventHandler', 'getFinanceOverview'],
] as const

describe('Nitro game API contracts', () => {
  it('keeps every documented endpoint implemented', async () => {
    for (const [file, ...markers] of endpoints) {
      const source = await readFile(file, 'utf8')
      for (const marker of markers) expect(source, `${file} missing ${marker}`).toContain(marker)
    }
  })
})
