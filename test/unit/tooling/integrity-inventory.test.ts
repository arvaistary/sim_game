import { describe, expect, it } from 'vitest'
import { discoverInventory } from '../../../scripts/integrity-audit/inventory'

describe('integrity inventory', () => {
  it('discovers current pages and game endpoints', async () => {
    const inventory = await discoverInventory(process.cwd())
    expect(inventory.routes).toContain('/')
    expect(inventory.routes).toContain('/game')
    expect(inventory.endpoints).toEqual(expect.arrayContaining(['game/init', 'game/state', 'game/actions/execute', 'game/sync']))
    expect(inventory.tests.length).toBeGreaterThan(0)
  })
})
