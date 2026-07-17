import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('integrity layer boundaries', () => {
  it('keeps domain and application modules free of Vue/Nuxt presentation imports', async () => {
    const files = ['src/domain/game-world/GameWorld.ts', 'src/domain/game-world/commands/execute-action.ts', 'src/application/game/commands.ts', 'src/application/game/queries.ts']
    for (const file of files) {
      const source = await readFile(file, 'utf8')
      expect(source, file).not.toMatch(/from ['"](?:vue|nuxt|pinia|@\/stores|@\/components|@\/pages)/)
    }
  })
})
