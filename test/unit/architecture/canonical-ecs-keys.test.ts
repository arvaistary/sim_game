import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const LEGACY_KEYS = ['event_queue', 'event_history', 'lifetime_stats', 'activity_log']
const ALLOWLIST = new Set([
  'src/domain/ecs/world.ts',
  'src/domain/ecs/components/index.ts',
  'src/types/ecs.ts',
])

async function collectFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir)
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry)
    const fileStat = await stat(fullPath)
    if (fileStat.isDirectory()) return collectFiles(fullPath)
    return fullPath.endsWith('.ts') ? [fullPath] : []
  }))
  return nested.flat()
}

describe('Canonical ECS runtime keys', () => {
  it('does not use legacy ECS keys outside compatibility boundary', async () => {
    const srcDir = path.resolve(process.cwd(), 'src')
    const files = await collectFiles(srcDir)
    const violations: string[] = []

    for (const file of files) {
      const relative = path.relative(process.cwd(), file).replace(/\\/g, '/')
      if (ALLOWLIST.has(relative)) continue

      const source = await readFile(file, 'utf8')
      const hasLegacyKey = LEGACY_KEYS.some((key) => source.includes(`'${key}'`) || source.includes(`"${key}"`))
      if (hasLegacyKey) {
        violations.push(relative)
      }
    }

    expect(violations).toEqual([])
  })
})
